import { z } from 'zod';

/* ============================================================
   Users Schemas
   Table: users
   ------------------------------------------------------------
   Columns:
     - id:             String (PK, not nullable)
     - email:          String (unique, not nullable)
     - password_hash:  String (not nullable)
     - is_demo:        Boolean (not nullable, default: false)
     - created_at:     String (timestamp, not nullable)
     - updated_at:     String (timestamp, not nullable)
============================================================ */

// ====================
// Entity Schema
// ====================
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email({ message: "Invalid email address" }),
  password_hash: z.string().min(1, { message: "Password hash is required" }),
  is_demo: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ====================
// Create Input Schema
// (Exclude: id, created_at, updated_at)
// ====================
export const createUserInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  // Optionally allow setting demo status; defaults to false.
  is_demo: z.boolean().optional().default(false),
});

// ====================
// Update Input Schema
// (Includes id and optional fields for updating)
// ====================
export const updateUserInputSchema = z.object({
  id: z.string(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).optional(),
  is_demo: z.boolean().optional(),
});

// ====================
// Query/Search Schema
// (For filtering, pagination, and sorting)
// ====================
export const searchUserInputSchema = z.object({
  // A free text search query that might search on email, etc.
  query: z.string().optional(),
  // Optionally filter by demo flag.
  is_demo: z.boolean().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  // Allow sorting by one of the selectable fields.
  sort_by: z.enum(['email', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ====================
// Response Schemas
// ====================
export const userResponseSchema = z.object({
  data: userSchema,
});

export const usersResponseSchema = z.object({
  data: z.array(userSchema),
  count: z.number().int(),
});

// ====================
// Inferred Types
// ====================
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

/* ============================================================
   Tasks Schemas
   Table: tasks
   ------------------------------------------------------------
   Columns:
     - id:            String (PK, not nullable)
     - user_id:       String (FK to users.id, not nullable)
     - title:         String (not nullable)
     - description:   String (nullable)
     - due_date:      String (timestamp/date, nullable)
     - priority:      String (not nullable, default: 'Medium')
                      Allowed values: 'High', 'Medium', 'Low'
     - is_completed:  Boolean (not nullable, default: false)
     - manual_order:  Number (integer, not nullable)
     - created_at:    String (timestamp, not nullable)
     - updated_at:    String (timestamp, not nullable)
============================================================ */

// ====================
// Entity Schema
// ====================
export const taskSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().nullable(),
  // Use z.coerce.date() to convert input to Date; allow null.
  due_date: z.coerce.date().nullable(),
  priority: z.enum(['High', 'Medium', 'Low']),
  is_completed: z.boolean(),
  manual_order: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// ====================
// Create Input Schema
// (Exclude: id, created_at, updated_at)
// ====================
export const createTaskInputSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  // Optional fields: if not provided, they can be omitted or set to null.
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  // Provide default values matching DB defaults.
  priority: z.enum(['High', 'Medium', 'Low']).optional().default('Medium'),
  is_completed: z.boolean().optional().default(false),
  manual_order: z.number().int(),
});

// ====================
// Update Input Schema
// (Includes id and optional update fields)
// ====================
export const updateTaskInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  title: z.string().min(1, { message: "Title is required" }).optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  is_completed: z.boolean().optional(),
  manual_order: z.number().int().optional(),
});

// ====================
// Query/Search Schema
// (For filtering, pagination, and sorting)
// ====================
export const searchTaskInputSchema = z.object({
  // A free text search to match title or description.
  query: z.string().optional(),
  // Optionally filter tasks by a specific user.
  user_id: z.string().optional(),
  // Filter by completion status.
  is_completed: z.boolean().optional(),
  // Filter by priority level.
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  // Sorting can be done by one of these fields.
  sort_by: z.enum(['title', 'due_date', 'priority', 'manual_order', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ====================
// Response Schemas
// ====================
export const taskResponseSchema = z.object({
  data: taskSchema,
});

export const tasksResponseSchema = z.object({
  data: z.array(taskSchema),
  count: z.number().int(),
});

// ====================
// Inferred Types
// ====================
export type Task = z.infer<typeof taskSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type SearchTaskInput = z.infer<typeof searchTaskInputSchema>;