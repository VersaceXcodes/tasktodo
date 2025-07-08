import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/main";

const UV_Landing: React.FC = () => {
  // Get the store actions for updating auth token and current user
  const set_auth_token = useAppStore((state) => state.set_auth_token);
  const set_current_user = useAppStore((state) => state.set_current_user);
  
  const navigate = useNavigate();

  // Define action handlers according to the datamap
  const navigateToLogin = () => {
    navigate("/login");
  };

  const navigateToSignup = () => {
    navigate("/signup");
  };

  const activateDemoMode = () => {
    // Set demo token and demo user details in the global store
    set_auth_token("demo_token");
    set_current_user({
      id: "demo_user",
      email: "demo@example.com",
      is_demo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    // Redirect to dashboard after setting demo mode
    navigate("/dashboard");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {/* Hero Banner */}
        <div className="w-full max-w-4xl mx-auto p-4">
          <img 
            src="https://picsum.photos/seed/landing/800/400" 
            alt="Hero Banner" 
            className="w-full rounded-lg shadow-lg mb-8" 
          />
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">
            Welcome to Simple Project To-Do Manager
          </h1>
          <p className="text-xl text-center text-gray-600 mb-8">
            Manage your tasks effortlessly and boost your productivity with a simple, intuitive interface.
          </p>
        </div>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            type="button"
            onClick={navigateToLogin}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Log In
          </button>
          <button
            type="button"
            onClick={navigateToSignup}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={activateDemoMode}
            className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            Demo Mode
          </button>
        </div>

        {/* Additional informational copy or footer note if needed */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          Experience a streamlined way to manage your projects. No sign-up required to try our demo mode.
        </footer>
      </div>
    </>
  );
};

export default UV_Landing;