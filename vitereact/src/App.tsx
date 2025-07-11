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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity
    }
  }
});

const App: React.FC = () => {
  const { auth_token, current_user, init_socket } = useAppStore();
  const isAuthenticated = Boolean(auth_token) && Boolean(current_user);

  useEffect(() => {
    if (isAuthenticated) {
      init_socket();
    }
  }, [isAuthenticated, init_socket]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" data-testid="app-container">
          {isAuthenticated ? <GV_TopNav_Auth /> : <GV_TopNav_Unauth />}
          
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={!isAuthenticated ? <UV_Landing /> : <UV_Dashboard />} />
              <Route path="/login" element={!isAuthenticated ? <UV_Login /> : <UV_Dashboard />} />
              <Route path="/signup" element={!isAuthenticated ? <UV_Signup /> : <UV_Dashboard />} />
              <Route path="/dashboard" element={isAuthenticated ? <UV_Dashboard /> : <UV_Login />} />
              <Route path="/dashboard/new-task" element={isAuthenticated ? <UV_NewTaskModal /> : <UV_Login />} />
              <Route path="/dashboard/edit-task/:id" element={isAuthenticated ? <UV_EditTaskModal /> : <UV_Login />} />
              <Route path="/dashboard/confirm-delete/:id" element={isAuthenticated ? <UV_ConfirmationModal /> : <UV_Login />} />
              <Route path="/dashboard/onboarding" element={isAuthenticated ? <UV_OnboardingOverlay /> : <UV_Login />} />
            </Routes>
          </main>

          <GV_Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;