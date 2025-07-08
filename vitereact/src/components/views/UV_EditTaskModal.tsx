import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from '@/store/main';

// Assuming we import types from shared zod schemas (if available)
// Here we define a minimal Task type for type safety
type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "Low" | "Medium" | "High";
  is_completed: boolean;
  manual_order: number;
  created_at: string;
  updated_at: string;
};

type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  due_date?: string | null;
  priority?: "Low" | "Medium" | "High";
};

const UV_EditTaskModal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Global State
  const authToken = useAppStore((state) => state.auth_token);
  const taskList = useAppStore((state) => state.task_list);
  const update_task = useAppStore((state) => state.update_task);
  const set_ui_modal = useAppStore((state) => state.set_ui_modal);

  // Local states for form fields
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Check if task is already in global state and pre-populate the form
  useEffect(() => {
    const task = taskList.find((t) => t.id === id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? task.due_date : "");
      setPriority(task.priority);
    }
  }, [id, taskList]);

  // If task not found in globalStore, fetch from backend using react-query
  const { isLoading } = useQuery<Task>({
    queryKey: ["task", id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks/${id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return response.data.data;
    },
    enabled: !taskList.find((t) => t.id === id),
    onSuccess: (data) => {
      setTitle(data.title);
      setDescription(data.description || "");
      setDueDate(data.due_date ? data.due_date : "");
      setPriority(data.priority);
    },
    onError: (error) => {
      console.error("Error fetching task data:", error);
    },
  });

  // Mutation to update task details on "Save" button click
  const mutation = useMutation<Task, Error, Partial<UpdateTaskInput>>({
    mutationFn: async (updatedData) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks/${id}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update the global task list with the updated task
      update_task(data);
      // Close the edit modal by updating the global UI modal state and navigate back to dashboard
      set_ui_modal("show_edit_task_modal", false);
      navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
    },
  });

  // Handler for saving the updated task
  const handleSave = () => {
    if (!title.trim()) {
      alert("Title is required.");
      return;
    }
    const payload: Partial<UpdateTaskInput> = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      due_date: dueDate.trim() ? dueDate.trim() : null,
      priority,
    };
    mutation.mutate(payload);
  };

  // Handler for cancelling the edit
  const handleCancel = () => {
    set_ui_modal("show_edit_task_modal", false);
    navigate("/dashboard");
  };

  return (
    <>
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="p-4 bg-white rounded shadow">Loading...</div>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50">
          <div className="bg-white rounded shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Title</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
              <textarea
                className="w-full px-3 py-2 border rounded"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Due Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Priority</label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={handleSave}
                disabled={mutation.isLoading}
              >
                Save
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                onClick={handleCancel}
                disabled={mutation.isLoading}
              >
                Cancel
              </button>
            </div>
            {mutation.isError && (
              <div className="mt-4 text-red-500">
                Error updating task. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UV_EditTaskModal;