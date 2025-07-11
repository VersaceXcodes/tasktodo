import React, { useEffect, memo, useCallback } from "react";
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
      staleTime: 300000,
      suspense: false,
      cacheTime: 3600000
    }
  }
});

const ProtectedRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { auth_token, current_user } = useAppStore();
  const isAuthenticated = Boolean(auth_token && current_user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
});

const PublicRoute = memo(({ children }: { children: React.ReactNode }) => {
  const { auth_token, current_user } = useAppStore();
  const isAuthenticated = Boolean(auth_token && current_user);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
});

const App = () => {
  const { auth_token, current_user, init_socket } = useAppStore();
  const isAuthenticated = Boolean(auth_token && current_user);

  useEffect(() => {
    document.title = "Task Management App";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      const newMetaDescription = document.createElement('meta');
      newMetaDescription.setAttribute('name', 'description');
      newMetaDescription.setAttribute('content', 'Task Management Application');
      document.head.appendChild(newMetaDescription);
    }
  }, []);

  useEffect(() => {
    let socketCleanup: (() => void) | undefined;
    let mounted = true;

    const initializeSocket = async () => {
      if (isAuthenticated && mounted) {
        try {
          socketCleanup = await init_socket();
        } catch (error) {
          console.error('Socket initialization failed:', error);
        }
      }
    };

    initializeSocket();

    return () => {
      mounted = false;
      if (typeof socketCleanup === 'function') {
        try {
          socketCleanup();
        } catch (error) {
          console.error('Socket cleanup failed:', error);
        }
      }
    };
  }, [isAuthenticated, init_socket]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col" data-testid="app-container">
          {isAuthenticated ? <GV_TopNav_Auth /> : <GV_TopNav_Unauth />}
          
          <main className="flex-grow">
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
          </main>

          <GV_Footer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default memo(App);console.log('Testing deployment failure detection');
