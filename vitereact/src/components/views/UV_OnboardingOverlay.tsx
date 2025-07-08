import React, { useState } from "react";
import { useAppStore } from "@/store/main";

const UV_OnboardingOverlay: React.FC = () => {
  // Local state for overlay visibility (default true)
  const [overlayVisible, setOverlayVisible] = useState<boolean>(true);
  
  // Access the global ui_modals setter from the Zustand store
  const set_ui_modal = useAppStore(state => state.set_ui_modal);

  // dismissOverlay action: update local state and global ui_modals
  const dismissOverlay = () => {
    setOverlayVisible(false);
    set_ui_modal("show_onboarding_overlay", false);
  };

  return (
    <>
      {overlayVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to Your Dashboard!</h2>
            <p className="mb-2">
              Click the <span className="font-bold">New Task</span> button to add your first task.
            </p>
            <p className="mb-4">
              Use the filtering options to search and sort your tasks.
            </p>
            <button
              onClick={dismissOverlay}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_OnboardingOverlay;