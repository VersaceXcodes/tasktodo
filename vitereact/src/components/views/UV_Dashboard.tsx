import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";
import { Task } from "@/DB:zodschemas:ts";

const UV_Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  // Global store variables (using correct selectors)
  const authToken = useAppStore((state) => state.auth_token);
  const task_filters = useAppStore((state) => state.task_filters);
  const taskList = useAppStore((state) => state.task_list);
  const updateTaskList = useAppStore((state) => state.update_task_list);
  const updateTask = useAppStore((state) => state.update_task);
  const setTaskFilters = useAppStore((state) => state.set_task_filters);

  // Local state for search input and drag/drop
  const [searchQuery, setSearchQuery] = useState(task_filters.query);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Function to fetch tasks using current filter criteria
  const fetchTasks = async (): Promise<Task[]> => {
    const params: any = { ...task_filters };
    if (params.is_completed === null) delete params.is_completed;
    if (params.priority === null) delete params.priority;
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        params,
      }
    );
    return response.data.data;
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
  });

  // Mutation to toggle completion status of a task
  const markTaskMutation = useMutation(
    async (task: Task) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${task.id}`,
        { is_completed: !task.is_completed },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data.data as Task;
    },
    {
      onSuccess: (updatedTask) => {
        updateTask(updatedTask);
      },
    }
  );

  // Mutation to reorder tasks after drag-and-drop
  const reorderMutation = useMutation(
    async (ordered: { id: string; manual_order: number }[]) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/reorder`,
        { tasks: ordered },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data.data as Task[];
    },
    {
      onSuccess: (updatedTasks) => {
        updateTaskList(updatedTasks);
      },
    }
  );

  // Drag-and-drop event handlers
  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    taskId: string
  ) => {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    dropTaskId: string
  ) => {
    event.preventDefault();
    if (!draggedTaskId || draggedTaskId === dropTaskId) return;
    const updatedTasks = [...taskList];
    const draggedIndex = updatedTasks.findIndex((t) => t.id === draggedTaskId);
    const dropIndex = updatedTasks.findIndex((t) => t.id === dropTaskId);
    if (draggedIndex < 0 || dropIndex < 0) return;
    const [removed] = updatedTasks.splice(draggedIndex, 1);
    updatedTasks.splice(dropIndex, 0, removed);
    const reordered = updatedTasks.map((task, index) => ({
      id: task.id,
      manual_order: index + 1,
    }));
    reorderMutation.mutate(reordered);
    setDraggedTaskId(null);
  };

  // Update filter based on status: "all", "active", "completed"
  const handleFilterStatus = (status: "all" | "active" | "completed") => {
    let is_completed: boolean | null = null;
    if (status === "active") is_completed = false;
    else if (status === "completed") is_completed = true;
    setTaskFilters({ is_completed });
    refetch();
  };

  // Handle search input change and apply filter on search
  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchQuery(event.target.value);
  };

  const applySearch = () => {
    setTaskFilters({ query: searchQuery });
    refetch();
  };

  // Handle sorting changes
  const handleSortByChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTaskFilters({ sort_by: event.target.value });
    refetch();
  };

  const handleSortOrderChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setTaskFilters({ sort_order: event.target.value as "asc" | "desc" });
    refetch();
  };

  // Calculate summary counts from global task_list
  const totalTasks = taskList.length;
  const activeTasks = taskList.filter((t) => !t.is_completed).length;
  const completedTasks = taskList.filter((t) => t.is_completed).length;

  return (
    <>
      {isLoading && (
        <div className="text-center py-4 text-lg font-semibold">
          Loading tasks...
        </div>
      )}
      {isError && (
        <div className="text-center py-4 text-red-500">
          Error: {(error as Error).message}
        </div>
      )}
      {!isLoading && !isError && (
        <div className="container mx-auto p-4">
          {/* Dashboard Header */}
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

          {/* Summary Panel */}
          <div className="p-4 bg-white shadow rounded mb-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold">{totalTasks}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{activeTasks}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{completedTasks}</div>
              <div className="text-sm text-gray-600">Completed Tasks</div>
            </div>
          </div>

          {/* Filter and Sorting Options */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Search Field */}
            <div className="flex items-center mb-2 md:mb-0">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search tasks..."
                className="border rounded-l px-3 py-2 focus:outline-none"
              />
              <button
                onClick={applySearch}
                className="bg-blue-500 text-white px-3 py-2 rounded-r"
              >
                Search
              </button>
            </div>
            {/* Status Filters */}
            <div className="flex space-x-2 mb-2 md:mb-0">
              <button
                onClick={() => handleFilterStatus("all")}
                className={`px-3 py-2 rounded ${
                  task_filters.is_completed === null
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterStatus("active")}
                className={`px-3 py-2 rounded ${
                  task_filters.is_completed === false
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterStatus("completed")}
                className={`px-3 py-2 rounded ${
                  task_filters.is_completed === true
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Completed
              </button>
            </div>
            {/* Sorting Controls */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Sort by:</label>
              <select
                value={task_filters.sort_by}
                onChange={handleSortByChange}
                className="border rounded px-2 py-1 focus:outline-none"
              >
                <option value="created_at">Created At</option>
                <option value="due_date">Due Date</option>
                <option value="manual_order">Manual Order</option>
              </select>
              <select
                value={task_filters.sort_order}
                onChange={handleSortOrderChange}
                className="border rounded px-2 py-1 focus:outline-none"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>

          {/* New Task Button */}
          <div className="mb-4 text-right">
            <Link to="/dashboard/new-task">
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                New Task
              </button>
            </Link>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {taskList.length === 0 ? (
              <div className="text-center p-4 bg-gray-100 rounded">
                No tasks available. Click "New Task" to add your first task.
              </div>
            ) : (
              taskList.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, task.id)}
                  className="p-3 bg-white border rounded flex items-center space-x-3 shadow"
                >
                  {/* Drag Handle */}
                  <span className="cursor-move select-none text-xl">≡</span>
                  {/* Completion Toggle */}
                  <input
                    type="checkbox"
                    checked={task.is_completed}
                    onChange={() => markTaskMutation.mutate(task)}
                    className="cursor-pointer"
                  />
                  {/* Task Details */}
                  <div className="flex-grow">
                    <div
                      className={`font-bold ${
                        task.is_completed ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {task.title}
                    </div>
                    {task.due_date && (
                      <div className="text-sm text-gray-500">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="text-sm">
                      Priority:{" "}
                      <span
                        className={
                          task.priority === "High"
                            ? "text-red-500"
                            : task.priority === "Medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <Link
                    to={`/dashboard/edit-task/${task.id}`}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/dashboard/confirm-delete/${task.id}`}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default UV_Dashboard;