"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [departmentId, setDepartmentId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!departmentId.trim() || !apiKey.trim()) {
      setError("Both Department ID and API Key are required.");
      setIsLoading(false);
      return;
    }

    try {
      // Calling your specific endpoint and passing the key in the headers
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        // Extracts the specific error message from your centralized error handler
        throw new Error(
          result.error ||
            "Authentication failed. Please check your credentials.",
        );
      }

      // Success! Store the credentials so the dashboard can use them for subsequent API calls
      localStorage.setItem("demo_departmentId", departmentId);
      localStorage.setItem("demo_apiKey", apiKey);

      // Store the department name if it exists in your schema for UI personalization later
      if (result.data?.name) {
        localStorage.setItem("demo_departmentName", result.data.name);
      }

      // Route to the split-pane dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        (err as Error).message ||
          "An unexpected error occurred connecting to the server.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Notification Microservice
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Authenticate your department
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label
                htmlFor="departmentId"
                className="block text-center text-sm font-medium text-gray-700"
              >
                Department ID
              </label>
              <input
                id="departmentId"
                name="departmentId"
                type="text"
                required
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                placeholder="Paste your Department ID here"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="apiKey"
                className="block text-center text-sm font-medium text-gray-700"
              >
                Department API Key
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="password"
                required
                disabled={isLoading}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
                placeholder="Paste your API key here"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {isLoading ? "Authenticating..." : "Connect"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
