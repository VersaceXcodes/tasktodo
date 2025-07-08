import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from '@/store/main';

interface TaskForm {
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "Low" | "Medium" | "High";
}

interface CreateTaskPayload {
  user_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: "Low" | "Medium" | "High";
  is_completed?: boolean;
  manual_order: number;
}

interface TaskResponse {
  data: {
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
}

const UV_NewTaskModal: React.FC = () => {
  const navigate = useNavigate();

  // Global state access using individual selectors to avoid infinite re-renders
  const authToken = useAppStore((state) => state.auth_token);
  const currentUser = useAppStore((state) => state.current_user);
  const taskList = useAppStore((state) => state.task_list);
  const addTask = useAppStore((state) => state.add_task);
  const setUIModal = useAppStore((state) => state.set_ui_modal);

  // Local state for form data and error message
  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: "",
    due_date: null,
    priority: "Medium",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Mutation function to create a new task via the API
  const createTask = async (payload: CreateTaskPayload): Promise<TaskResponse> => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks`;
    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };
    const response = await axios.post<TaskResponse>(url, payload, config);
    return response.data;
  };

  const mutation = useMutation<TaskResponse, Error, CreateTaskPayload>({
    mutationFn: createTask,
    onSuccess: (data) => {
      // Add the new task to the global task list
      addTask(data.data);
      // Optionally display success feedback here
      // Dismiss the modal by updating the global UI state and navigate to the dashboard
      setUIModal("show_new_task_modal", false);
      navigate("/dashboard");
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to save task.");
    },
  });

  // Handler for form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handler for the Save button
  const handleSave = () => {
    // Simple inline validation for required title
    if (!taskForm.title || taskForm.title.trim() === "") {
      setErrorMessage("Task Title is required.");
      return;
    }
    if (!currentUser) {
      setErrorMessage("User not authenticated.");
      return;
    }
    // Compute manual_order as the next number (e.g., existing tasks count + 1)
    const manual_order = taskList.length + 1;

    // Build the payload for the API call
    const payload: CreateTaskPayload = {
      user_id: currentUser.id,
      title: taskForm.title.trim(),
      description: taskForm.description && taskForm.description.trim() !== "" ? taskForm.description : null,
      due_date: taskForm.due_date,
      priority: taskForm.priority,
      is_completed: false,
      manual_order,
    };

    // Execute the mutation to save the task
    mutation.mutate(payload);
  };

  // Handler for the Cancel button
  const handleCancel = () => {
    // Dismiss the modal without saving changes
    setUIModal("show_new_task_modal", false);
    navigate("/dashboard");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-6">
          <h2 className="text-2xl font-bold mb-4">New Task</h2>
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              {errorMessage}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={taskForm.title}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="Enter task title"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={taskForm.description || ""}
              onChange={handleChange}
              className="w-full border rounded p-2"
              placeholder="Enter description (optional)"
              rows={3}
            ></textarea>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="due_date">Due Date</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={taskForm.due_date || ""}
                onChange={handleChange}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={taskForm.priority}
                onChange={handleChange}
                className="w-full border rounded p-2"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_NewTaskModal;