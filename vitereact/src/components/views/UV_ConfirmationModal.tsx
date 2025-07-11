import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/store/main";

interface RouteParams {
  id: string;
}

const UV_ConfirmationModal: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const taskId = id || "";
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const authToken = useAppStore((state) => state.auth_token);
  const remove_task = useAppStore((state) => state.remove_task);
  const set_ui_modal = useAppStore((state) => state.set_ui_modal);

  const deleteTaskMutation = useMutation<void, AxiosError>({
    mutationFn: async () => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      remove_task(taskId);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      set_ui_modal("show_confirmation_modal", false);
      navigate("/dashboard");
    },
    onError: (error: AxiosError) => {
      console.error("Error deleting task:", error);
      alert("Error deleting task. Please try again.");
    },
  });

  const handleConfirmDeletion = (): void => {
    deleteTaskMutation.mutate();
  };

  const handleCancelDeletion = (): void => {
    set_ui_modal("show_confirmation_modal", false);
    navigate("/dashboard");
  };

  return (
    <>
      <div 
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
          <h2 id="modal-title" className="text-xl font-semibold mb-4">Confirmation</h2>
          <p id="modal-description" className="mb-6">Are you sure you want to delete this task?</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleCancelDeletion}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeletion}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              aria-label="Confirm deletion"
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