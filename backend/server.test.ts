// tests/backend.test.mjs

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, pool } from './server.ts'; // import your Express app instance and database pool
import {
  createUserInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema
} from './schema.ts';

// ----------------------
// Helper Functions
// ----------------------
async function clearTestUser(testUserId) {
  // Clean up tasks first then user.
  await pool.query('DELETE FROM tasks WHERE user_id = $1', [testUserId]);
  await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
}

// ----------------------
// Unit Tests for Zod Schemas
// ----------------------
describe('Zod Schema Validation', () => {
  describe('User Schemas', () => {
    it('should pass with valid createUserInputSchema data', () => {
      const validData = {
        email: 'valid@example.com',
        password: 'longenoughpassword'
      };
      const parsed = createUserInputSchema.parse(validData);
      expect(parsed).toMatchObject({ email: validData.email, password: validData.password, is_demo: false });
    });

    it('should fail when password is too short', () => {
      const invalidData = {
        email: 'valid@example.com',
        password: 'short'
      };
      expect(() => createUserInputSchema.parse(invalidData)).toThrow();
    });

    it('should fail with invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'longenoughpassword'
      };
      expect(() => createUserInputSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Task Schemas', () => {
    it('should pass with valid createTaskInputSchema data', () => {
      const validTask = {
        title: 'New Task',
        manual_order: 1
      };
      const parsed = createTaskInputSchema.parse(validTask);
      expect(parsed).toHaveProperty('title', 'New Task');
      expect(parsed).toHaveProperty('priority', 'Medium'); // default value
    });

    it('should fail if required title is missing', () => {
      const invalidTask = {
        manual_order: 1
      };
      expect(() => createTaskInputSchema.parse(invalidTask)).toThrow();
    });
  });
});

// ----------------------
// Integration Tests
// ----------------------
describe('Integration Tests', () => {
  let authToken;
  let testUserId;
  const testUserEmail = 'testuser@example.com';
  const testUserPassword = 'password1234'; // must be at least 8 characters

  // Create a test user before tests
  beforeAll(async () => {
    // first remove if exists (cleanup)
    await pool.query('DELETE FROM users WHERE email = $1', [testUserEmail]);

    // Sign up the test user
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: testUserEmail, password: testUserPassword });
    expect(signupRes.status).toBe(201);
    testUserId = signupRes.body.data.id;

    // Login to get the token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUserEmail, password: testUserPassword });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
  });

  // Clean up test data after tests complete
  afterAll(async () => {
    await clearTestUser(testUserId);
    // Optionally end pool connection if needed.
    await pool.end();
  });

  // Begin transaction for each test for isolation (if supported)
  beforeEach(async () => {
    await pool.query('BEGIN');
  });
  
  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  // ----------------------
  // Authentication Endpoints
  // ----------------------
  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/signup', () => {
      it('should create a new user with valid payload', async () => {
        // Use a unique email to avoid duplicate conflict.
        const email = 'newuser@example.com';
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email, password: 'anothergoodpassword' });
        expect(res.status).toBe(201);
        expect(res.body.data.email).toBe(email);
      });

      it('should return 400 when email is invalid', async () => {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'invalid-email', password: 'anothergoodpassword' });
        expect(res.status).toBe(400);
      });

      it('should return 400 when password is too short', async () => {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'shortpass@example.com', password: '123' });
        expect(res.status).toBe(400);
      });

      it('should return 400 for duplicate email', async () => {
        // testUserEmail already exists from beforeAll
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: testUserEmail, password: 'anothergoodpassword' });
        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login successfully with correct credentials', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: testUserEmail, password: testUserPassword });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.data.email).toBe(testUserEmail);
      });

      it('should return 401 for wrong password', async () => {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: testUserEmail, password: 'wrongpassword' });
        expect(res.status).toBe(401);
      });
    });

    describe('GET /api/auth/user', () => {
      it('should retrieve current user details with valid token', async () => {
        const res = await request(app)
          .get('/api/auth/user')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(testUserEmail);
      });

      it('should return 401 if no token is provided', async () => {
        const res = await request(app).get('/api/auth/user');
        expect(res.status).toBe(401);
      });
    });
  });

  // ----------------------
  // Task Endpoints
  // ----------------------
  describe('Task Endpoints', () => {
    let createdTaskId;

    describe('GET /api/tasks', () => {
      it('should retrieve an empty list if no tasks exist', async () => {
        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
      });

      it('should retrieve a list of tasks for authenticated user', async () => {
        // Create a task first
        const createRes = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Integration Test Task', manual_order: 1 });
        expect(createRes.status).toBe(201);
        
        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.count).toBeGreaterThan(0);
      });

      it('should filter tasks by is_completed status', async () => {
        // Create two tasks – one completed, one active
        await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Task Not Completed', manual_order: 2, is_completed: false });
        const createComp = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Task Completed', manual_order: 3, is_completed: true });
        expect(createComp.status).toBe(201);

        const res = await request(app)
          .get('/api/tasks?is_completed=true')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        // Check that every returned task has is_completed = true
        res.body.data.forEach(task => {
          expect(task.is_completed).toBe(true);
        });
      });
    });

    describe('POST /api/tasks', () => {
      it('should create a new task with valid data', async () => {
        const taskData = {
          title: 'New Task for Integration Test',
          manual_order: 1,
          description: 'A sample description',
          due_date: '2023-12-31',
          priority: 'High'
        };
        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData);
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('title', taskData.title);
        createdTaskId = res.body.data.id;
      });

      it('should return 400 when required field "title" is missing', async () => {
        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ manual_order: 1 });
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/tasks/:id', () => {
      beforeEach(async () => {
        // Ensure there is at least one task available by creating one
        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Task to Get By Id', manual_order: 5 });
        createdTaskId = res.body.data.id;
      });

      it('should retrieve the task by its id', async () => {
        const res = await request(app)
          .get(`/api/tasks/${createdTaskId}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('id', createdTaskId);
      });

      it('should return 404 when task is not found', async () => {
        const res = await request(app)
          .get('/api/tasks/nonexistenttaskid')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(404);
      });
    });

    describe('PATCH /api/tasks/:id', () => {
      let taskToUpdateId;
      beforeEach(async () => {
        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Task to Update', manual_order: 10 });
        taskToUpdateId = res.body.data.id;
      });

      it('should update an existing task', async () => {
        const updateData = { title: 'Updated Task Title', is_completed: true };
        const res = await request(app)
          .patch(`/api/tasks/${taskToUpdateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe(updateData.title);
        expect(res.body.data.is_completed).toBe(true);
      });

      it('should return 404 when updating a non-existent task', async () => {
        const res = await request(app)
          .patch('/api/tasks/nonexistentid')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Won’t update' });
        expect(res.status).toBe(404);
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      let taskToDeleteId;
      beforeEach(async () => {
        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Task to Delete', manual_order: 20 });
        taskToDeleteId = res.body.data.id;
      });

      it('should delete a task successfully', async () => {
        const res = await request(app)
          .delete(`/api/tasks/${taskToDeleteId}`)
          .set('Authorization', `Bearer ${authToken}`);
        // Assuming deletion returns 204 No Content
        expect(res.status).toBe(204);

        // Ensure subsequent fetch returns 404
        const getRes = await request(app)
          .get(`/api/tasks/${taskToDeleteId}`)
          .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.status).toBe(404);
      });

      it('should return 404 when trying to delete a non-existent task', async () => {
        const res = await request(app)
          .delete('/api/tasks/nonexistentid')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(404);
      });
    });

    describe('PATCH /api/tasks/reorder', () => {
      let task1, task2;
      beforeEach(async () => {
        // Create two tasks that we will reorder.
        const res1 = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Reorder Task 1', manual_order: 1 });
        task1 = res1.body.data;
        const res2 = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Reorder Task 2', manual_order: 2 });
        task2 = res2.body.data;
      });

      it('should successfully reorder tasks', async () => {
        const reorderPayload = {
          tasks: [
            { id: task1.id, manual_order: 2 },
            { id: task2.id, manual_order: 1 }
          ]
        };
        const res = await request(app)
          .patch('/api/tasks/reorder')
          .set('Authorization', `Bearer ${authToken}`)
          .send(reorderPayload);
        expect(res.status).toBe(200);
        // Verify that tasks have been reordered: sort by manual_order and check their titles
        const tasksSorted = res.body.data.sort((a, b) => a.manual_order - b.manual_order);
        expect(tasksSorted[0].id).toBe(task2.id);
        expect(tasksSorted[1].id).toBe(task1.id);
      });

      it('should return 400 when payload is invalid', async () => {
        // Missing tasks key in payload
        const res = await request(app)
          .patch('/api/tasks/reorder')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ wrongKey: [] });
        expect(res.status).toBe(400);
      });
    });
  });
});