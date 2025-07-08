-- Create the "users" table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create the "tasks" table with a foreign key referencing "users"
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'Medium',
  is_completed BOOLEAN NOT NULL DEFAULT false,
  manual_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);

--------------------------------------------------
-- Seed data for the "users" table
--------------------------------------------------
INSERT INTO users (id, email, password_hash, is_demo, created_at, updated_at)
VALUES
  ('user1', 'alice@example.com', 'hashed_password_alpha', false, '2023-10-01T12:00:00Z', '2023-10-01T12:00:00Z'),
  ('user2', 'bob@example.com', 'hashed_password_beta', false, '2023-10-02T12:00:00Z', '2023-10-02T12:00:00Z'),
  ('user3', 'charlie@example.com', 'hashed_password_gamma', true, '2023-10-03T12:00:00Z', '2023-10-03T12:00:00Z'),
  ('user4', 'diana@example.com', 'hashed_password_delta', false, '2023-10-04T12:00:00Z', '2023-10-04T12:00:00Z'),
  ('user5', 'eva@example.com', 'hashed_password_epsilon', false, '2023-10-05T12:00:00Z', '2023-10-05T12:00:00Z');

--------------------------------------------------
-- Seed data for the "tasks" table
--------------------------------------------------
-- Tasks for user1
INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
VALUES
  ('task1', 'user1', 'Buy groceries', 'Milk, Bread, Eggs', '2023-10-10', 'High', false, 1, '2023-10-06T09:00:00Z', '2023-10-06T09:00:00Z'),
  ('task2', 'user1', 'Plan vacation', 'Book flights and hotels', '2023-10-15', 'Medium', false, 2, '2023-10-06T10:00:00Z', '2023-10-06T10:00:00Z'),
  ('task3', 'user1', 'Call mom', NULL, NULL, 'Low', false, 3, '2023-10-06T11:00:00Z', '2023-10-06T11:00:00Z');

-- Tasks for user2
INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
VALUES
  ('task4', 'user2', 'Finish report', 'Complete financial report for Q3', '2023-10-08', 'High', false, 1, '2023-10-07T09:30:00Z', '2023-10-07T09:30:00Z'),
  ('task5', 'user2', 'Team meeting', 'Discuss project milestones', '2023-10-09', 'Medium', false, 2, '2023-10-07T10:30:00Z', '2023-10-07T10:30:00Z');

-- Tasks for user3 (demo user)
INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
VALUES
  ('task6', 'user3', 'Demo task 1', 'This is a demo task', '2023-10-12', 'Low', false, 1, '2023-10-08T08:00:00Z', '2023-10-08T08:00:00Z'),
  ('task7', 'user3', 'Demo task 2', '', NULL, 'Medium', true, 2, '2023-10-08T09:00:00Z', '2023-10-08T09:00:00Z');

-- Task for user4
INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
VALUES
  ('task8', 'user4', 'Renew subscription', 'Check subscription services', '2023-10-20', 'Medium', false, 1, '2023-10-09T07:45:00Z', '2023-10-09T07:45:00Z');

-- Tasks for user5
INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed, manual_order, created_at, updated_at)
VALUES
  ('task9', 'user5', 'Dentist appointment', 'Visit dentist at 5 PM', '2023-10-11', 'High', false, 1, '2023-10-09T12:30:00Z', '2023-10-09T12:30:00Z'),
  ('task10', 'user5', 'Buy anniversary gift', 'Shopping for a gift', '2023-10-13', 'Medium', false, 2, '2023-10-09T13:30:00Z', '2023-10-09T13:30:00Z');