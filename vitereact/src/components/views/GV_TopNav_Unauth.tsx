import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from '@/store/main';

const GV_TopNav_Unauth: React.FC = () => {
  const navigate = useNavigate();
  const set_current_user = useAppStore(state => state.set_current_user);
  const set_auth_token = useAppStore(state => state.set_auth_token);

  // Handler for clicking the app logo: Navigate to landing page ("/")
  const handleLogoClick = () => {
    navigate("/");
  };

  // Handler for clicking "Log In": Navigate to the login page ("/login")
  const handleLoginClick = () => {
    navigate("/login");
  };

  // Handler for clicking "Sign Up": Navigate to the signup page ("/signup")
  const handleSignupClick = () => {
    navigate("/signup");
  };

  // Handler for clicking "Demo Mode": Set demo mode state and navigate to dashboard ("/dashboard")
  const handleDemoModeClick = () => {
    // Set a demo user with required fields
    const demoUser = {
      id: "demo-user",
      email: "demo@example.com",
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    // Set a dummy auth token for demo mode
    set_auth_token("demo-token");
    set_current_user(demoUser);
    navigate("/dashboard");
  };

  return (
    <>
      <nav className="bg-white shadow fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <img
                src="https://picsum.photos/seed/logo/80/40"
                alt="App Logo"
                className="h-10 w-auto cursor-pointer"
                onClick={handleLogoClick}
              />
            </div>
            <div className="flex space-x-6">
              <button
                onClick={handleLoginClick}
                className="text-gray-800 hover:text-blue-500 focus:outline-none"
              >
                Log In
              </button>
              <button
                onClick={handleSignupClick}
                className="text-gray-800 hover:text-blue-500 focus:outline-none"
              >
                Sign Up
              </button>
              <button
                onClick={handleDemoModeClick}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
              >
                Demo Mode
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav_Unauth;