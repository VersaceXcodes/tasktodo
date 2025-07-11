import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useAppStore } from '@/store/main';
import DOMPurify from 'dompurify';

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

  const authToken = useAppStore((state) => state.auth_token);
  const currentUser = useAppStore((state) => state.current_user);
  const taskList = useAppStore((state) => state.task_list);
  const addTask = useAppStore((state) => state.add_task);
  const setUIModal = useAppStore((state) => state.set_ui_modal);

  const [taskForm, setTaskForm] = useState<TaskForm>({
    title: "",
    description: "",
    due_date: null,
    priority: "Medium",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateInput = (value: string, field: string): string => {
    const sanitizedValue = DOMPurify.sanitize(value.trim());
    
    if (field === 'title') {
      if (sanitizedValue.length === 0) return 'Title is required.';
      if (sanitizedValue.length > 100) return 'Title must be less than 100 characters.';
    }
    
    if (field === 'description') {
      if (sanitizedValue.length > 500) return 'Description must be less than 500 characters.';
    }
    
    if (field === 'due_date') {
      const date = new Date(sanitizedValue);
      if (sanitizedValue && isNaN(date.getTime())) return 'Invalid date format.';
      if (date < new Date(new Date().setHours(0, 0, 0, 0))) return 'Due date cannot be in the past.';
    }
    
    return '';
  };

  const createTask = async (payload: CreateTaskPayload): Promise<TaskResponse> => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/tasks`;
    const config = {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    const response = await axios.post<TaskResponse>(url, payload, config);
    return response.data;
  };

  const mutation = useMutation<TaskResponse, Error, CreateTaskPayload>({
    mutationFn: createTask,
    onSuccess: (data) => {
      addTask(data.data);
      setUIModal("show_new_task_modal", false);
      navigate("/dashboard");
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to save task.");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const error = validateInput(value, name);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage("");
    
    setTaskForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    const titleError = validateInput(taskForm.title, 'title');
    const descriptionError = taskForm.description ? validateInput(taskForm.description, 'description') : '';
    const dueDateError = taskForm.due_date ? validateInput(taskForm.due_date, 'due_date') : '';

    if (titleError || descriptionError || dueDateError) {
      setErrorMessage(titleError || descriptionError || dueDateError);
      return;
    }

    if (!currentUser) {
      setErrorMessage("User not authenticated.");
      return;
    }

    const manual_order = taskList.length + 1;

    const payload: CreateTaskPayload = {
      user_id: currentUser.id,
      title: DOMPurify.sanitize(taskForm.title.trim()),
      description: taskForm.description ? DOMPurify.sanitize(taskForm.description.trim()) : null,
      due_date: taskForm.due_date,
      priority: taskForm.priority,
      is_completed: false,
      manual_order,
    };

    mutation.mutate(payload);
  };

  const handleCancel = () => {
    setUIModal("show_new_task_modal", false);
    navigate("/dashboard");
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-lg p-6">
          <h2 id="modal-title" className="text-2xl font-bold mb-4">New Task</h2>
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4" role="alert">
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
              maxLength={100}
              required
              aria-required="true"
              aria-invalid={!taskForm.title}
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
              maxLength={500}
              aria-label="Task description"
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
                min={new Date().toISOString().split('T')[0]}
                aria-label="Task due date"
              />