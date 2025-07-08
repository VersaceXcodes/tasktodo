import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

const UV_ConfirmationModal: React.FC = () => {
  // Extract task ID from route parameters.
  const { id } = useParams<{ id: string }>();
  const taskId = id || "";
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Access authToken, remove_task, and set_ui_modal from the global store.
  const authToken = useAppStore((state) => state.auth_token);
  const remove_task = useAppStore((state) => state.remove_task);
  const set_ui_modal = useAppStore((state) => state.set_ui_modal);

  // Define the mutation for deleting a task.
  const deleteTaskMutation = useMutation(
    async () => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
    },
    {
      onSuccess: () => {
        // Remove the deleted task from the global state.
        remove_task(taskId);
        // Invalidate any queries related to tasks.
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        // Close the confirmation modal.
        set_ui_modal("show_confirmation_modal", false);
        // Navigate back to the dashboard.
        navigate("/dashboard");
      },
      onError: (error: any) => {
        console.error("Error deleting task:", error);
        // Provide user feedback for the error.
        alert("Error deleting task. Please try again.");
      },
    }
  );

  // Handler for confirming deletion.
  const handleConfirmDeletion = () => {
    deleteTaskMutation.mutate();
  };

  // Handler for canceling deletion.
  const handleCancelDeletion = () => {
    // Close the modal and navigate back to the dashboard.
    set_ui_modal("show_confirmation_modal", false);
    navigate("/dashboard");
  };

  // Render the modal dialog as one single JSX fragment.
  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
          <h2 className="text-xl font-semibold mb-4">Confirmation</h2>
          <p className="mb-6">Are you sure you want to delete this task?</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancelDeletion}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeletion}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ConfirmationModal;