import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from '@/store/main';

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

  const authToken = useAppStore((state) => state.auth_token);
  const taskList = useAppStore((state) => state.task_list);
  const update_task = useAppStore((state) => state.update_task);
  const set_ui_modal = useAppStore((state) => state.set_ui_modal);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const task = taskList.find((t) => t.id === id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.due_date ? task.due_date : "");
      setPriority(task.priority);
    }
  }, [id, taskList]);

  const validateInputs = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 255) {
      newErrors.title = "Title must be less than 255 characters";
    }

    if (description && description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      if (isNaN(dueDateObj.getTime())) {
        newErrors.dueDate = "Invalid date format";
      } else if (dueDateObj < new Date(new Date().setHours(0, 0, 0, 0))) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    if (!["Low", "Medium", "High"].includes(priority)) {
      newErrors.priority = "Invalid priority value";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sanitizeInputs = (input: UpdateTaskInput): UpdateTaskInput => {
    return {
      title: input.title?.trim(),
      description: input.description?.trim() || null,
      due_date: input.due_date?.trim() || null,
      priority: input.priority,
    };
  };

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
      update_task(data);
      set_ui_modal("show_edit_task_modal", false);
      navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Failed to update task:", error);
      setErrors({ submit: "Failed to update task. Please try again." });
    },
  });

  const handleSave = () => {
    if (!validateInputs()) {
      return;
    }

    const payload: Partial<UpdateTaskInput> = {
      title,
      description,
      due_date: dueDate,
      priority,
    };

    const sanitizedPayload = sanitizeInputs(payload);
    mutation.mutate(sanitizedPayload);
  };

  const handleCancel = () => {
    set_ui_modal("show_edit_task_modal", false);
    navigate("/dashboard");
  };

  return (
    <>
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50" role="dialog" aria-label="Loading">
          <div className="p-4 bg-white rounded shadow">Loading...</div>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-50 z-50" role="dialog" aria-labelledby="modal-title">
          <div className="bg-white rounded shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6">
            <h2 id="modal-title" className="text-2xl font-semibold mb-4">Edit Task</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
              <input
                id="title"
                type="text"
                className={`w-full px-3 py-2 border rounded ${errors.title ? 'border-red-500' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                aria-required="true"
                aria-invalid={!!errors.title}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
              <textarea
                id="description"
                className={`w-full px-3 py-2 border rounded ${errors.description ? 'border-red-500' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                aria-label="Task description"
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="dueDate" className="block text-gray-700 text-sm font-bold mb-2">Due Date</label>
              <input
                id="dueDate"
                type="date"
                className={`w-full px-3 py-2 border rounded ${errors.dueDate ? 'border-red-500' : ''}`}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-invalid={!!errors.dueDate}
              />
              {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
            </div>
            <div className="mb-4">
              <label htmlFor="priority" className="block text-gray-700 text-sm font-bold mb-2">Priority</label>
              <select
                id="priority"
                className={`w-full px-3 py-2 border rounded ${errors.priority ? 'border-red-500' : ''}`}
                value={priority}
                onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
                aria-invalid={!!errors.priority}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority}</p>}
            </div>
            {errors.submit && <p className="text-red-500 text-sm mb-4">{errors.submit}</p>}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                disabled={mutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={mutation.isLoading}
              >
                {mutation.isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_EditTaskModal;