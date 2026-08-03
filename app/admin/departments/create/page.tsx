"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAutoClearError } from "@/app/hooks/useAutoClearError";

export default function CreateDepartmentPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [allowedChannels, setAllowedChannels] = useState<string[]>(["email"]); // Defaulting to email

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const { error, setError } = useAutoClearError();

  // Success State (Holds the one-time API key)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Helper to toggle channels in the array
  const handleCheckboxChange = (channel: string) => {
    setAllowedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (allowedChannels.length === 0) {
      setError(
        "You must select at least one allowed channel for this department.",
      );
      setIsLoading(false);
      return;
    }

    try {
      const adminToken = localStorage.getItem("admin_token");

      const res = await fetch("/api/departments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": adminToken || "",
        },
        body: JSON.stringify({ name, contactEmail, allowedChannels }),
      });

      const json = await res.json();

      // Check for success based on your backend response structure
      if (!res.ok || !json.success) {
        throw new Error(
          json.message || json.error || "Failed to create department",
        );
      }

      // Success! Save the key to state instead of redirecting
      setGeneratedKey(json.data.apiKey);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // PHASE 2: The Success Screen
  if (generatedKey) {
    return (
      <div className="p-8 max-w-2xl mx-auto mt-10">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Department Created!
          </h2>
          <p className="text-gray-700 mb-6">
            Please copy this API key now.{" "}
            <strong className="text-red-600">
              You will not be able to see it again.
            </strong>
          </p>

          <div className="bg-gray-900 text-green-400 p-4 rounded text-lg font-mono mb-6 break-all select-all">
            {generatedKey}
          </div>

          <button
            onClick={() => router.push("/admin/departments")}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            I have copied the key &rarr; Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // PHASE 1: The Creation Form
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/departments"
          className="text-sm text-gray-500 hover:text-black"
        >
          &larr; Back to Departments
        </Link>
      </div>

      <h1 className="text-2xl  text-center font-bold mb-6">
        Create New Department
      </h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
      >
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Department Name
          </label>
          <input
            type="text"
            required
            minLength={2}
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="e.g., Marketing, HR"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Contact Email
          </label>
          <input
            type="email"
            required
            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="alerts@department.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        {/* Allowed Channels (Matching your backend logic) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Allowed Channels
          </label>
          <div className="flex gap-4">
            {["email", "sms", "push", "whatsapp"].map((channel) => (
              <label
                key={channel}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={allowedChannels.includes(channel)}
                  onChange={() => handleCheckboxChange(channel)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                <span className="capitalize text-sm">{channel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 mt-6 border-t border-gray-200">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => router.push("/admin/departments")}
            className="w-1/2 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-1/2 bg-black text-white py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium shadow-sm"
          >
            {isLoading ? "Creating..." : "Create Department"}
          </button>
        </div>
      </form>
    </div>
  );
}
