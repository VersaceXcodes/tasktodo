import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/main";

// Define interfaces for API payload and response
interface SignupRequest {
  email: string;
  password: string;
  is_demo?: boolean;
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

const UV_Signup: React.FC = () => {
  // Local state for form inputs and error handling
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const navigate = useNavigate();
  // Global store actions for updating auth token and current user
  const set_auth_token = useAppStore((state) => state.set_auth_token);
  const set_current_user = useAppStore((state) => state.set_current_user);

  // Define mutation for signup API call using react-query and axios
  const signupMutation = useMutation<AuthResponse, any, SignupRequest>({
    mutationFn: async (payload: SignupRequest) => {
      const url = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/signup`;
      const response = await axios.post(url, payload);
      return response.data;
    },
    onSuccess: (data) => {
      // On success, update global state and navigate to dashboard
      set_auth_token(data.token);
      set_current_user(data.data);
      navigate("/dashboard");
    },
    onError: (error: any) => {
      // Extract error message from response if available, otherwise use a default message
      const message =
        error.response?.data?.message || "Sign up failed. Please try again.";
      setErrorMessage(message);
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate required fields and matching passwords
    if (!email || !password || !confirmPassword) {
      setErrorMessage("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    // Trigger the signup mutation with the user-provided payload
    signupMutation.mutate({ email, password, is_demo: false });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
          {errorMessage && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              {errorMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={signupMutation.isLoading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
            >
              {signupMutation.isLoading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default UV_Signup;