"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TemplateChannel, CreateTemplateInput } from "@/types/template";
import AIPromptModal from "@/app/dashboard/components/AIPromptModal";
import { Sparkles } from "lucide-react";
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
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/departments/me");

        if (res.status === 401) {
          router.push("/");
          return;
        }

        const json = await res.json();
        if (json.success && json.data?.allowedChannels) {
          setAllowedChannels(json.data.allowedChannels);
        }
      } catch (err) {
        console.error("Failed to load department channels", err);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: CreateTemplateInput = {
      name,
      channel,
      body,
      templateType,
      // Include subject when provided
      ...(subject && { subject }),
    };

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push("/");
        return;
      }

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
    <div className="p-6 max-w-6xl mx-auto">
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
            {/* Default empty option */}
            <option value="" disabled>
              Select a channel
            </option>

            {/* Render allowed channels */}
            {allowedChannels?.map((ch: string) => (
              <option key={ch} value={ch}>
                {channelLabels[ch] || ch}
              </option>
            ))}
          </select>
        </div>
        {/* --- TEMPLATE TYPE BLOCK --- */}
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
            <option value="single">Single </option>
            <option value="diffusion">Diffusion </option>
          </select>
        </div>
        {/* --- SUBJECT BLOCK --- */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject (Optional, mainly for Email)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Welcome to our platform!"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Template Body
            </label>
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="group inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              <span>Generate with AI</span>
            </button>
          </div>
          <textarea
            required
            minLength={5}
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full min-h-[300px] border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
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
      {/* AI Prompt Modal Component */}
      <AIPromptModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        channel={channel}
        onGenerated={(generatedText: string) => setBody(generatedText)}
      />
    </div>
  );
}
