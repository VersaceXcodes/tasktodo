```typescript
import React, { useState } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";
import { Task, TaskFilters } from "@/DB:zodschemas:ts";
import { z } from "zod";

interface TaskResponse {
  data: Task[];
}

interface TaskUpdateResponse {
  data: Task;
}

interface ReorderTaskPayload {
  id: string;
  manual_order: number;
}

const searchQuerySchema = z.string().trim().max(100);
const sortBySchema = z.enum(["created_at", "due_date", "priority", "manual_order"]);
const sortOrderSchema = z.enum(["asc", "desc"]);
const taskIdSchema = z.string().uuid();

const UV_Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const authToken = useAppStore((state) => state.auth_token);
  const task_filters = useAppStore((state) => state.task_filters);
  const taskList = useAppStore((state) => state.task_list);
  const updateTaskList = useAppStore((state) => state.update_task_list);
  const updateTask = useAppStore((state) => state.update_task);
  const setTaskFilters = useAppStore((state) => state.set_task_filters);

  const [searchQuery, setSearchQuery] = useState<string>(task_filters.query || "");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const validateAndSanitizeSearchQuery = (query: string): string | null => {
    try {
      return searchQuerySchema.parse(query);
    } catch (error) {
      setValidationError("Invalid search query");
      return null;
    }
  };

  const validateTaskId = (id: string): boolean => {
    try {
      taskIdSchema.parse(id);
      return true;
    } catch (error) {
      return false;
    }
  };

  const fetchTasks = async (): Promise<Task[]> => {
    try {
      const params: Partial<TaskFilters> = { ...task_filters };
      if (params.is_completed === null) delete params.is_completed;
      if (params.priority === null) delete params.priority;
      if (params.query) {
        const sanitizedQuery = validateAndSanitizeSearchQuery(params.query);
        if (sanitizedQuery) {
          params.query = sanitizedQuery;
        } else {
          delete params.query;
        }
      }
      
      const response: AxiosResponse<TaskResponse> = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks`,
        {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params,
          withCredentials: true
        }
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch tasks');
    }
  };

  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Task[], Error>(["tasks", task_filters], fetchTasks, {
    onSuccess: (data) => {
      updateTaskList(data);
    },
    retry: 2,
    staleTime: 30000,
    cacheTime: 3600000,
    enabled: !!authToken
  });

  const markTaskMutation = useMutation<Task, Error, Task>(
    async (task: Task) => {
      if (!validateTaskId(task.id)) {
        throw new Error("Invalid task ID");
      }

      const response: AxiosResponse<TaskUpdateResponse> = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task.id}`,
        { is_completed: !task.is_completed },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );
      return response.data.data;
    },
    {
      onSuccess: (updatedTask) => {
        updateTask(updatedTask);
        queryClient.invalidateQueries(["tasks"]);
      },
      onError: (error) => {
        console.error('Failed to mark task:', error);
      },
    }
  );

  const reorderMutation = useMutation<Task[], Error, ReorderTaskPayload[]>(
    async (ordered) => {
      const validOrderedTasks = ordered.every(task => validateTaskId(task.id));
      if (!validOrderedTasks) {
        throw new Error("Invalid task ID in reorder payload");
      }

      const response: AxiosResponse<TaskResponse> = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/reorder`,
        { tasks: ordered },
        { 
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          withCredentials: true
        }
      );
      return response.data.data;
    },
    {
      onSuccess: (updatedTasks) => {
        updateTaskList(updatedTasks);
        queryClient.invalidateQueries(["tasks"]);
      },
      onError: (error) => {
        console.error('Failed to reorder tasks:', error);
      },
    }
  );

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, taskId: string): void => {
    if (!validateTaskId(taskId)) return;
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, dropTaskId: string): void => {
    event.preventDefault();
    if (!draggedTaskId || draggedTaskId === dropTaskId || !validateTaskId(dropTaskId)) return;
    
    const updatedTasks = [...taskList];
    const draggedIndex = updatedTasks.findIndex((t) => t.id === draggedTaskId);
    const dropIndex = updatedTasks.findIndex((t) => t.id === dropTaskId);
    
    if (draggedIndex < 0 || dropIndex < 0) return;
    
    const [removed] = updatedTasks.splice(draggedIndex, 1);
    updatedTasks.splice(dropIndex, 0, removed);
    
    const reordered: ReorderTaskPayload[] = updatedTasks.map((task, index) => ({
      id: task.id,
      manual_order: index + 1,
    }));
    
    reorderMutation.mutate(reordered);
    setDraggedTaskId(null);
  };

  const handleFilterStatus = (status: "all" | "active" | "completed"): void => {
    let is_completed: boolean | null = null;
    if (status === "active") is_