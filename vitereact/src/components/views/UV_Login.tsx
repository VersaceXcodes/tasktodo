import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useAppStore } from "@/store/main";

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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const set_auth_token = useAppStore((state) => state.set_auth_token);
  const set_current_user = useAppStore((state) => state.set_current_user);

  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const sanitizeInput = (input: string): string => {
    return input.trim();
  };

  const loginMutation = useMutation<AuthResponse, AxiosError, LoginRequest>({
    mutationFn: async (payload: LoginRequest) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/login`,
        {
          email: sanitizeInput(payload.email),
          password: payload.password
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      set_auth_token(data.token);
      set_current_user(data.data);
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const sanitizedEmail = sanitizeInput(email);
    
    if (!sanitizedEmail || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!validatePassword(password)) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    loginMutation.mutate({ email: sanitizedEmail, password });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrorMessage("");
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setErrorMessage("");
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded shadow">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        {errorMessage && (
          <div 
            role="alert"
            aria-live="polite"
            id="login-error"
            className="p-2 text-sm text-red-600 bg-red-100 border border-red-400 rounded"
          >
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={email !== "" && !validateEmail(email)}
              aria-describedby={errorMessage ? "login-error" : undefined}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={handleEmailChange}
              maxLength={100}
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
              name="password"
              aria-label="Password"
              aria-required="true"
              aria-invalid={password !== "" && !validatePassword(password)}
              aria-describedby={errorMessage ? "login-error" : undefined}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={handlePasswordChange}
              maxLength={100}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            aria-label={isSubmitting ? "Logging in..." : "Login"}
            className="w-full px-4 py-2 font-semibold text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-sm text-center">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-blue-500 hover:underline"
            aria-label="Sign up for an account"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
};

export default UV_Login;