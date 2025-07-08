import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/main";

const GV_TopNav_Auth: React.FC = () => {
  // Local state for controlling profile menu visibility and notification count.
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [notificationCount] = useState<number>(0);

  // Accessing global state: current_user and methods for logout.
  const currentUser = useAppStore((state) => state.current_user);
  const set_auth_token = useAppStore((state) => state.set_auth_token);
  const set_current_user = useAppStore((state) => state.set_current_user);

  // useNavigate hook for programmatic navigation.
  const navigate = useNavigate();

  // Action: Redirect user to dashboard when app logo is clicked.
  const handleLogoClick = () => {
    navigate("/dashboard");
  };

  // Action: Toggle profile dropdown menu visibility.
  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  // Action: Handle user logout, clearing auth state.
  const handleLogout = () => {
    // Clear global authentication data.
    set_auth_token(null);
    set_current_user(null);
    // Optionally, close the profile menu.
    setProfileMenuOpen(false);
    // Optionally, navigate to landing page after logout.
    navigate("/");
  };

  return (
    <>
      <div className="fixed top-0 w-full bg-white shadow z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          {/* Left section: Logo and navigation link */}
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" onClick={handleLogoClick}>
              <span className="text-xl font-bold text-blue-600 cursor-pointer">
                ToDoManager
              </span>
            </Link>
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-800 hidden sm:inline-block"
            >
              Dashboard
            </Link>
          </div>
          {/* Right section: Notification icon and Profile */}
          <div className="flex items-center space-x-4 relative">
            {/* Notification Icon */}
            <div className="relative cursor-pointer">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {notificationCount}
                </span>
              )}
            </div>
            {/* Profile Icon */}
            <div className="relative">
              <button onClick={toggleProfileMenu} className="flex items-center focus:outline-none">
                {currentUser ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    {currentUser.email.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white">
                    ?
                  </div>
                )}
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg py-2 z-10">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Spacer div to avoid overlaying content with fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_TopNav_Auth;