import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/* Import shared global views */
import GV_TopNav_Auth from './components/views/GV_TopNav_Auth';
import GV_TopNav_Unauth from './components/views/GV_TopNav_Unauth';
import GV_Footer from './components/views/GV_Footer';

/* Import unique views */
import UV_Landing from './components/views/UV_Landing';
import UV_Login from './components/views/UV_Login';
import UV_Signup from './components/views/UV_Signup';
import UV_Dashboard from './components/views/UV_Dashboard';
import UV_NewTaskModal from './components/views/UV_NewTaskModal';
import UV_EditTaskModal from './components/views/UV_EditTaskModal';
import UV_ConfirmationModal from './components/views/UV_ConfirmationModal';
import UV_OnboardingOverlay from './components/views/UV_OnboardingOverlay';

/* import the global state hook from Zustand */
import { useAppStore } from './store/main';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const { auth_token, current_user, init_socket } = useAppStore();
  const isAuthenticated = Boolean(auth_token) && Boolean(current_user);

  useEffect(() => {
    if (isAuthenticated) {
      init_socket();
    }
  }, [isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;