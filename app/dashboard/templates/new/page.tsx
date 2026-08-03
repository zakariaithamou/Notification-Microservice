"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateChannel, CreateTemplateInput } from "@/types/template";

const channelLabels: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push ",
  whatsapp: "WhatsApp",
};
export default function NewTemplatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("");
  const [channel, setChannel] = useState<TemplateChannel>("email");
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [templateType, setTemplateType] = useState<"single" | "diffusion">(
    "single",
  );
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const key = localStorage.getItem("demo_apiKey");
      if (!key) return;

      try {
        // NOTE: Make sure you have an API route that returns the department's profile!
        // If your route is named differently, update this URL.
        const res = await fetch("/api/departments/me", {
          headers: {
            "x-api-key": key,
          },
        });
        const json = await res.json();
        if (json.success && json.data?.allowedChannels) {
          setAllowedChannels(json.data.allowedChannels);
        }
      } catch (err) {
        console.error("Failed to load department channels", err);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: CreateTemplateInput = {
      name,
      channel,
      body,
      templateType,
      // Only include subject if it's an email or push where it makes sense, though your backend accepts it for all
      ...(subject && { subject }),
    };

    try {
      // Get key directly from localStorage
      const key = localStorage.getItem("demo_apiKey");
      if (!key) {
        router.push("/");
        return;
      }

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create template");

      router.push("/dashboard/templates");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Template</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Welcome_Email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as TemplateChannel)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            {/* Provide a default empty option so it doesn't auto-select a value accidentally */}
            <option value="" disabled>
              Select a channel
            </option>

            {/* 2. Dynamically map over the allowed channels fetched from the DB */}
            {allowedChannels?.map((ch: string) => (
              <option key={ch} value={ch}>
                {channelLabels[ch] || ch}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject (Optional, mainly for Email)
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Type
            </label>
            <select
              value={templateType}
              onChange={(e) =>
                setTemplateType(e.target.value as "single" | "diffusion")
              }
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="single">Single Message (One Student)</option>
              <option value="diffusion">Diffusion (Broadcast to Group)</option>
            </select>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Welcome to our platform!"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Body (HTML or Text)
          </label>
          <textarea
            required
            minLength={5}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            placeholder="Hello {{name}}, welcome to..."
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t mt-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/templates")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
