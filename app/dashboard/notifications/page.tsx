"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, FileText, Rocket } from "lucide-react";

// Interface based on your Mongoose Schema
interface ITemplate {
  _id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
}

export default function SendNotificationPage() {
  const router = useRouter();

  // State
  const [apiKey] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("demo_apiKey") ?? "";
  });
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [recipients, setRecipients] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});

  // UI State
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const key = localStorage.getItem("demo_apiKey");
    if (!key) {
      router.push("/");
      return;
    }

    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates", {
          headers: { "x-api-key": key },
        });
        const data = await res.json();
        if (res.ok) {
          setTemplates(data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [router]);

  // Extract variables like {{userName}} from the selected template
  const getRequiredVariables = () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) return [];

    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    const combinedText = (template.subject || "") + " " + template.body;

    while ((match = regex.exec(combinedText)) !== null) {
      matches.push(match[1].trim());
    }
    return Array.from(new Set(matches)); // Return unique variables
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage({ text: "", type: "" });

    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) {
      setSending(false);
      return;
    }

    // 1. Parse and extract emails
    const rawEmails = recipients
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    // 2. Validate email formats (Must have characters, an @ symbol, and a domain like .com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = rawEmails.filter((email) => !emailRegex.test(email));

    if (invalidEmails.length > 0) {
      setMessage({
        text: `Invalid email format detected: ${invalidEmails.join(", ")}`,
        type: "error",
      });
      setSending(false);
      return; // Stop execution before touching the database
    }

    // Map the validated emails to the required Mongoose schema structure
    const validRecipientArray = rawEmails.map((email) => ({ address: email }));

    // 3. Render the final subject and body by replacing variables
    let finalSubject = template.subject || "";
    let finalBody = template.body;

    Object.entries(variables).forEach(([key, val]) => {
      const replaceRegex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      finalSubject = finalSubject.replace(replaceRegex, val);
      finalBody = finalBody.replace(replaceRegex, val);
    });

    // 4. Build the payload
    const payload = {
      templateId: template._id,
      channel: template.channel,
      recipients: validRecipientArray,
      variables: variables,
      renderedSubject: finalSubject,
      renderedBody: finalBody,
    };

    try {
      // 5. Send strictly to the queue route
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "x-api-key": apiKey, // Uses your saved API key
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to queue notification.");
      }

      // Clean success message
      setMessage({
        text: "Success! Notification safely queued for delivery.",
        type: "success",
      });

      // Reset form
      setRecipients("");
      setVariables({});
      setSelectedTemplateId("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage({ text: err.message, type: "error" });
      } else {
        setMessage({ text: "An unknown error occurred.", type: "error" });
      }
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="animate-pulse">Loading secure dispatch console...</div>
    );

  const requiredVars = getRequiredVariables();

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Rocket className="w-5 h-5" /> Dispatch Notification
      </h1>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-md border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Template *
          </label>
          <select
            required
            value={selectedTemplateId}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              setVariables({}); // Reset variables when template changes
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>
              -- Choose a template --
            </option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.channel})
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Variable Inputs */}
        {requiredVars.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              Required Variables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredVars.map((v) => (
                <div key={v}>
                  <label className="block text-xs font-medium text-blue-900 mb-1">
                    {v}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`Enter value for ${v}`}
                    value={variables[v] || ""}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    className="w-full rounded-md border border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients (Emails) *
          </label>
          <textarea
            required
            placeholder="student1@ensa.ma, student2@ensa.ma"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            className="min-h-25 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple email addresses with a comma.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={sending || !selectedTemplateId}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Processing Payload..." : "Transmit to Microservice"}
          </button>
        </div>
      </form>
    </div>
  );
}
