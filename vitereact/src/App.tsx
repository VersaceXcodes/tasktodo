import React, { useEffect, memo } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes
      suspense: false,
      cacheTime: 3600000 // 1 hour
    }
  }
});

const App: React.FC = memo(() => {
  const { auth_token, current_user, init_socket } = useAppStore();
  const isAuthenticated = Boolean(auth_token && current_user);

  useEffect(() => {
    document.title = "Task Management App";
    
    let socketCleanup: (() => void) | undefined;
    
    if (isAuthenticated) {
      socketCleanup = init_socket();
    }

    return () => {
      if (socketCleanup) socketCleanup();
    };
  }, [isAuthenticated, init_socket]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" data-testid="app-container">
          {isAuthenticated ? <GV_TopNav_Auth /> : <GV_TopNav_Unauth />}
          
          <main className="flex-grow">
            <React.Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<PublicRoute><UV_Landing /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><UV_Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><UV_Signup /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><UV_Dashboard /></ProtectedRoute>} />
                <Route path="/dashboard/new-task" element={<ProtectedRoute><UV_NewTaskModal /></ProtectedRoute>} />
                <Route path="/dashboard/edit-task/:id" element={<ProtectedRoute><UV_EditTaskModal /></ProtectedRoute>} />
                <Route path="/dashboard/confirm-delete/:id" element={<ProtectedRoute><UV_ConfirmationModal /></ProtectedRoute>} />
                <Route path="/dashboard/onboarding" element={<ProtectedRoute><UV_OnboardingOverlay /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </React.Suspense>
          </main>

          <GV_Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
});

App.displayName = 'App';

export default App;