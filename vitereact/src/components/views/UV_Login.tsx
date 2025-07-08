import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useAppStore } from "@/store/main";

// Define interfaces based on the OpenAPI specification for login
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  data: {
    id: string;
    email: string;
    is_demo: boolean;
    created_at: string;
    updated_at: string;
  };
}

const UV_Login: React.FC = () => {
  // Local state variables for email, password, error message, and submission status
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Global state actions from Zustand store
  const set_auth_token = useAppStore((state) => state.set_auth_token);
  const set_current_user = useAppStore((state) => state.set_current_user);

  const navigate = useNavigate();

  // React Query mutation for submitting the login API call
  const loginMutation = useMutation<AuthResponse, AxiosError, LoginRequest>({
    mutationFn: async (payload: LoginRequest) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/login`,
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update global state with token and current user details
      set_auth_token(data.token);
      set_current_user(data.data);
      // Redirect to the Dashboard upon successful login
      navigate("/dashboard");
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message || "Login failed. Please try again."
      );
      setIsSubmitting(false);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  // Handle form submission and validation
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    // Basic inline validation for required fields
    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded shadow">
          <h2 className="text-2xl font-bold text-center">Login</h2>
          {errorMessage && (
            <div className="p-2 text-sm text-red-600 bg-red-100 border border-red-400 rounded">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block mb-1 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-1 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;