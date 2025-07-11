import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from '@/store/main';

const GV_TopNav_Unauth: React.FC = () => {
  const navigate = useNavigate();
  const set_current_user = useAppStore(state => state.set_current_user);
  const set_auth_token = useAppStore(state => state.set_auth_token);

  const handleLogoClick = () => {
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleSignupClick = () => {
    navigate("/signup");
  };

  const handleDemoModeClick = () => {
    const demoUser = {
      id: "demo-user",
      email: "demo@example.com",
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    set_auth_token("demo-token");
    set_current_user(demoUser);
    navigate("/dashboard");
  };

  return (
    <>
      <nav className="bg-white shadow fixed w-full top-0 z-10" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <button
                onClick={handleLogoClick}
                className="h-10 w-auto cursor-pointer"
                aria-label="Go to home page"
              >
                <img
                  src="https://picsum.photos/seed/logo/80/40"
                  alt="App Logo"
                  className="h-10 w-auto"
                />
              </button>
            </div>
            <div className="flex space-x-6">
              <button
                onClick={handleLoginClick}
                className="text-gray-800 hover:text-blue-500 focus:outline-none"
                aria-label="Log in"
              >
                Log In
              </button>
              <button
                onClick={handleSignupClick}
                className="text-gray-800 hover:text-blue-500 focus:outline-none"
                aria-label="Sign up"
              >
                Sign Up
              </button>
              <button
                onClick={handleDemoModeClick}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none"
                aria-label="Try demo mode"
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