// server.mjs

// Load environment variables from .env file before everything else.
import "dotenv/config";

// Import required libraries & modules
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Import Zod schemas from the schema.ts file (which contains both user and task schemas)
import {
  userSchema,
  createUserInputSchema,
  updateUserInputSchema,
  searchUserInputSchema,
  taskSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  searchTaskInputSchema
} from "./schema.ts";

// ==============================
// TypeScript interface extensions
// ==============================
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
      };
    }
  }
}

// ==============================
// PostgreSQL Pool Setup
// ==============================
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { rejectUnauthorized: false },
      }
);

// ==============================
// Express App Setup
// ==============================
const app = express();

// CORS FIRST - before any other middleware
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors({ origin: true, credentials: true }));

// Middleware to parse JSON bodies
app.use(express.json());

// Logger middleware for detailed request logging
app.use(morgan("dev"));

// ==============================
// JWT Authentication Middleware
// ==============================
/*
  This middleware checks for an Authorization header bearing a JWT token.
  On verification the decoded token (payload containing the user_id) is attached to req.user.
  If token is missing or invalid, a 401 Unauthorized error is returned.
*/
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });
  
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Missing token" });
  
  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    // Attach the decoded token (we expect user_id here) to the request object.
    req.user = user;
    next();
  });
}

// ==============================
// API Endpoints for Authentication
// ==============================

/*
  Endpoint: POST /api/auth/signup
  Description: Creates a new user account.
  Validates the input using the createUserInputSchema.
  Hashes the password; creates a new user with generated id and timestamps.
  Signs a JWT token with the new user id and returns it along with the user info.
*/
app.post("/api/auth/signup", async (req, res) => {
  try {
    // Validate input using Zod
    const result = createUserInputSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }
    const { email, password, is_demo } = result.data;
    
    // Check if the email already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already in use" });
    }
    
    // Generate a new user id and hash the provided password
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const timestamp = new Date().toISOString();

    // Insert the new user into the database
    const insertQuery = `
      INSERT INTO users (id, email, password_hash, is_demo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, is_demo, created_at, updated_at
    `;
    const values = [id, email, hashedPassword, is_demo ?? false, timestamp, timestamp];
    const { rows } = await pool.query(insertQuery, values);
    const user = rows[0];

    // Sign a JWT token with the new user id
    const token = jwt.sign({ user_id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    res.status(201).json({ token, data: user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: POST /api/auth/login
  Description: Authenticates a user given email and password.
  Checks the provided credentials against the database.
  On success, returns a JWT token and user details.
*/
app.post("/api/auth/login", async (req, res) => {
  try {
    // Basic validation (could also use a Zod schema for login)
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    // Fetch the user from the database
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const userFromDB = rows[0];
    // Compare the provided password with the stored hashed password
    const isValid = await bcrypt.compare(password, userFromDB.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Create a token payload. Only the user id is stored.
    const token = jwt.sign({ user_id: userFromDB.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    
    // Return user info without the password hash
    const user = {
      id: userFromDB.id,
      email: userFromDB.email,
      is_demo: userFromDB.is_demo,
      created_at: userFromDB.created_at,
      updated_at: userFromDB.updated_at
    };
    
    res.status(200).json({ token, data: user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: GET /api/auth/user
  Description: Retrieves details of the currently authenticated user.
  The JWT token is verified by the auth middleware.
*/
app.get("/api/auth/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.user_id;
    const { rows } = await pool.query("SELECT id, email, is_demo, created_at, updated_at FROM users WHERE id = $1", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==============================
// API Endpoints for Task Management
// ==============================

/*
  Endpoint: GET /api/tasks
  Description: Retrieves all tasks for the authenticated user.
  Supports filtering by title, completion status, priority; sorting; and pagination.
  Constructs a dynamic SQL query based on provided query parameters.
*/
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.user_id;
    // Destructure and process query parameters
    const {
      query, 
      is_completed, 
      priority,
      sort_by = "created_at",
      sort_order = "desc",
      limit = 10,
      offset = 0
    } = req.query;
    
    // Build query conditions and parameters array. Always filter by user.
    const conditions = ["user_id = $1"];
    const values: any[] = [userId];
    let paramIndex = 2;
    
    // If search query is provided, use ILIKE for case-insensitive pattern matching.
    if (query) {
      conditions.push(`title ILIKE $${paramIndex}`);
      values.push(`%${String(query)}%`);
      paramIndex++;
    }
    // Filter by is_completed if provided (convert string "true"/"false" to boolean)
    if (is_completed !== undefined) {
      conditions.push(`is_completed = $${paramIndex}`);
      values.push(String(is_completed) === "true");
      paramIndex++;
    }
    // Filter by priority if provided
    if (priority) {
      conditions.push(`priority = $${paramIndex}`);
      values.push(String(priority));
      paramIndex++;
    }
    
    // Construct the final SQL query using the conditions and sorting / pagination parameters.
    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
    const dataQuery = `
      SELECT * FROM tasks
      ${whereClause}
      ORDER BY ${String(sort_by)} ${String(sort_order).toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(Number(limit), Number(offset));
    
    // Execute the query to fetch tasks
    const { rows: tasks } = await pool.query(dataQuery, values);
    
    // Run a separate query to get a total count for pagination
    const countQuery = `SELECT COUNT(*) FROM tasks ${whereClause}`;
    const { rows: countRows } = await pool.query(countQuery, values.slice(0, paramIndex - 1));
    const count = Number(countRows[0].count);
    
    res.status(200).json({ data: tasks, count });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: POST /api/tasks
  Description: Creates a new task for the authenticated user.
  Validates input using createTaskInputSchema.
  Generates a new task id and sets timestamps.
*/
app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    // Validate the input data using Zod
    const result = createTaskInputSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }
    const { title, description, due_date, priority, is_completed, manual_order } = result.data;
    
    // Use authenticated user's id from the JWT token
    const user_id = req.user!.user_id;
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    
    const insertQuery = `
      INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      id,
      user_id,
      title,
      description ?? null,
      due_date ? new Date(due_date).toISOString() : null,
      priority,
      is_completed,
      manual_order,
      timestamp,
      timestamp
    ];
    
    const { rows } = await pool.query(insertQuery, values);
    res.status(201).json({ data: rows[0] });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: GET /api/tasks/:id
  Description: Retrieves a specific task by its id.
  Ensures that the task belongs to the authenticated user.
*/
app.get("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user!.user_id;
    const { id } = req.params;
    
    const { rows } = await pool.query(
      "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error("Get task by ID error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: PATCH /api/tasks/:id
  Description: Updates an existing task.
  Validates input data against updateTaskInputSchema and updates only provided fields.
  Also updates the updated_at timestamp.
*/
app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user!.user_id;
    const { id } = req.params;
    
    // Validate the update payload using Zod.
    const result = updateTaskInputSchema.safeParse({ id, ...req.body });
    if (!result.success) {
      return res.status(400).json({ error: result.error.errors });
    }
    const updateData = result.data;
    
    // Dynamically build the SET clause for fields that need to be updated.
    const allowedFields = ["title", "description", "due_date", "priority", "is_completed", "manual_order"];
    const setClauses = [];
    const values = [];
    let idx = 1;
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // For due_date, if provided, format as ISO string (if not null)
        if (field === "due_date" && updateData[field] !== null) {
          setClauses.push(`${field} = $${idx}`);
          values.push(new Date(updateData[field]).toISOString());
        } else {
          setClauses.push(`${field} = $${idx}`);
          values.push(updateData[field]);
        }
        idx++;
      }
    }
    
    // Always update the updated_at timestamp
    setClauses.push(`updated_at = $${idx}`);
    values.push(new Date().toISOString());
    
    if (setClauses.length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update" });
    }
    
    // Append the id and user_id for the WHERE clause.
    const updateQuery = `
      UPDATE tasks SET ${setClauses.join(", ")}
      WHERE id = $${idx + 1} AND user_id = $${idx + 2}
      RETURNING *
    `;
    values.push(id, user_id);
    
    const { rows } = await pool.query(updateQuery, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }
    res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: DELETE /api/tasks/:id
  Description: Deletes a task.
  Checks that the task belongs to the authenticated user before deletion.
*/
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user!.user_id;
    const { id } = req.params;
    
    const deleteQuery = "DELETE FROM tasks WHERE id = $1 AND user_id = $2";
    const { rowCount } = await pool.query(deleteQuery, [id, user_id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: "Task not found or unauthorized" });
    }
    // Return HTTP 204 No Content for successful deletion
    res.status(204).send();
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/*
  Endpoint: PATCH /api/tasks/reorder
  Description: Updates the manual order of tasks via a drag-and-drop operation.
  Expects a payload containing an array of task objects with id and manual_order.
  Processes the updates in a transaction to ensure atomicity.
*/
app.patch("/api/tasks/reorder", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user!.user_id;
    // Inline validation of the reorder payload using Zod-like structure.
    // Expected format: { tasks: [{ id: string, manual_order: number }, ...] }
    const reorderPayload = req.body;
    if (!reorderPayload || !Array.isArray(reorderPayload.tasks)) {
      return res.status(400).json({ error: "Invalid payload. Expected tasks array." });
    }
    
    // Begin transaction for atomic batch update
    await pool.query("BEGIN");
    for (const taskItem of reorderPayload.tasks) {
      // For each task, update the manual_order and updated_at timestamp.
      const updateQuery = `
        UPDATE tasks SET manual_order = $1, updated_at = $2
        WHERE id = $3 AND user_id = $4
      `;
      await pool.query(updateQuery, [
        taskItem.manual_order,
        new Date().toISOString(),
        taskItem.id,
        user_id
      ]);
    }
    await pool.query("COMMIT");
    
    // After reordering, fetch the updated list of tasks for the user.
    const { rows: tasks } = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY manual_order ASC",
      [user_id]
    );
    res.status(200).json({ data: tasks, count: tasks.length });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Reorder tasks error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==============================
// Static Files & SPA Routing
// ==============================

// ESM workaround for __dirname
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Catch-all route for SPA routing (send index.html for unmatched routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==============================
// Start the Server
// ==============================

export { app, pool };

// Only start the server if this file is run directly (not during tests)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
