import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* Import shared global views */
import GV_TopNav_Auth from '@/components/views/GV_TopNav_Auth.tsx';
import GV_TopNav_Unauth from '@/components/views/GV_TopNav_Unauth.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';

/* Import unique views */
import UV_Landing from '@/components/views/UV_Landing.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_Signup from '@/components/views/UV_Signup.tsx';
import UV_Dashboard from '@/components/views/UV_Dashboard.tsx';
import UV_NewTaskModal from '@/components/views/UV_NewTaskModal.tsx';
import UV_EditTaskModal from '@/components/views/UV_EditTaskModal.tsx';
import UV_ConfirmationModal from '@/components/views/UV_ConfirmationModal.tsx';
import UV_OnboardingOverlay from '@/components/views/UV_OnboardingOverlay.tsx';

/* import the global state hook from Zustand */
import { useAppStore } from '@/store/main';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const { auth_token, current_user, init_socket } = useAppStore();
  const isAuthenticated = Boolean(auth_token) && Boolean(current_user);

  // Optionally initialize the socket connection if authenticated.
  useEffect(() => {
    if (isAuthenticated) {
      init_socket();
    }
    // We intentionally do not add init_socket in dependency list because its reference is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {/* Render different top navigation based on authentication */}
        {isAuthenticated ? <GV_TopNav_Auth /> : <GV_TopNav_Unauth />}

        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
          
            <Routes>
              <Route path="/" element={<UV_Landing />} />
              <Route path="/login" element={<UV_Login />} />
              <Route path="/signup" element={<UV_Signup />} />
              <Route path="/dashboard" element={<UV_Dashboard />} />
              <Route path="/dashboard/new-task" element={<UV_NewTaskModal />} />
              <Route path="/dashboard/edit-task/:id" element={<UV_EditTaskModal />} />
              <Route path="/dashboard/confirm-delete/:id" element={<UV_ConfirmationModal />} />
              <Route path="/dashboard/onboarding" element={<UV_OnboardingOverlay />} />
            </Routes>
          </main>

          <GV_Footer />
        </div>
      </QueryClientProvider>
    </BrowserRouter>
    </>
  );
};

export default App;