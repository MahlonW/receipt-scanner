"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AnimatedBackground from "@/components/AnimatedBackground";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const redirectedFrom = searchParams.get("redirect") || "/";
        router.push(redirectedFrom);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Incorrect password.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Use the reusable AnimatedBackground component */}
      <AnimatedBackground />

      {/* Login Form Card - z-10 ensures it's above the background shapes */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800/60 dark:backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.svg" alt="Receipt Scanner" className="w-10 h-10" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Receipt Scanner
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter the password to access the protected area.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="relative block w-full px-4 py-3 text-gray-900 dark:text-white dark:bg-gray-700/50 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 sm:text-sm disabled:opacity-60"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-center text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                {/* Lock icon */}
                <svg
                  className={`h-5 w-5 text-indigo-500 dark:text-indigo-300 group-hover:text-indigo-400 dark:group-hover:text-indigo-200 ${isLoading ? "hidden" : ""}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {/* Loading Spinner */}
                {isLoading && (
                  <svg
                    className="w-5 h-5 text-indigo-300 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
              </span>
              {isLoading ? "Verifying..." : "Continue"}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-8 text-xs text-center text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} Receipt Scanner. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
