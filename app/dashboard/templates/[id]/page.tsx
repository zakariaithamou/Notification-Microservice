"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  Edit,
  Sparkles,
} from "lucide-react";
import { formatHtml, htmlToPlainText } from "@/lib/htmlHelpers";

import AIPromptModal from "@/app/dashboard/components/AIPromptModal";

interface TemplateData {
  _id: string;
  name: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  templateType: "single" | "diffusion";
  subject?: string;
  body: string;
}

export default function UpdateTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const templateId = resolvedParams.id;

  // State
  const [originalData, setOriginalData] = useState<TemplateData | null>(null);
  const [formData, setFormData] = useState<TemplateData | null>(null);
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

  // Body View Tab
  const [bodyView, setBodyView] = useState<
    "edit" | "rendered" | "formatted" | "plain"
  >("edit");
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templateRes, deptRes] = await Promise.all([
          fetch(`/api/templates/${templateId}`),
          fetch("/api/departments/me"),
        ]);

        if (templateRes.status === 401 || deptRes.status === 401) {
          router.push("/");
          return;
        }

        //  Process Department Channels
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          if (deptData.success && deptData.data?.allowedChannels) {
            setAllowedChannels(deptData.data.allowedChannels);
          }
        }

        //  Process Template Data

        const contentType = templateRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Server did not return JSON. The API route might be missing or broken.",
          );
        }

        const templateData = await templateRes.json();

        if (templateRes.ok && templateData.data) {
          setOriginalData(templateData.data);
          setFormData(templateData.data);
        } else {
          setError(templateData.message || "Failed to fetch template details.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [templateId, router]);

  const handleSave = async () => {
    if (!formData || !originalData) return;

    setError(null);
    setSuccessMsg(null);
    setSaving(true);

    // 1. Calculate exactly what changed to only send those elements
    const updates: Partial<TemplateData> = {};
    if (formData.name !== originalData.name) updates.name = formData.name;
    if (formData.channel !== originalData.channel)
      updates.channel = formData.channel;
    if (formData.templateType !== originalData.templateType)
      updates.templateType = formData.templateType;
    if (formData.subject !== originalData.subject)
      updates.subject = formData.subject;
    if (formData.body !== originalData.body) updates.body = formData.body;

    // 2. If nothing changed, just show a message and exit
    if (Object.keys(updates).length === 0) {
      setSuccessMsg("No changes detected.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Template updated successfully!");
        setOriginalData(data.data); // Reset original data to the newly saved data
        setFormData(data.data);
      } else {
        setError(data.error || "Failed to update template.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }
  if (error && !formData)
    return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!formData)
    return <div className="p-6 text-gray-500">Template not found.</div>;

  return (
    <div className="p-6 max-w-8xl mx-auto">
      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center gap-2">
          <AlertTriangle size={20} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Update Template</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Read-Only ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template ID
            </label>
            <input
              type="text"
              readOnly
              value={formData._id}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Type
              </label>
              <select
                value={formData.templateType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    templateType: e.target.value as "single" | "diffusion",
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="single">Single</option>
                <option value="diffusion">Diffusion</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Channel
              </label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    channel: e.target.value as
                      "email" | "sms" | "push" | "whatsapp",
                  })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white capitalize"
              >
                {allowedChannels.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (Optional for some channels, but good to have) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject (Optional)
              </label>
              <input
                type="text"
                value={formData.subject || ""}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Email Subject"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Body Section with Tabs */}
          <div>
            {/* Header with Label and AI Refine Button */}
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Template Body
              </label>
              <button
                type="button"
                onClick={() => setIsAIModalOpen(true)}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                <span>Refine with AI</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setBodyView("edit")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  bodyView === "edit"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Edit size={16} /> Edit HTML
              </button>
              <button
                onClick={() => setBodyView("rendered")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  bodyView === "rendered"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Eye size={16} /> Preview
              </button>
              <button
                onClick={() => setBodyView("plain")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  bodyView === "plain"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText size={16} /> Plain Text
              </button>
            </div>

            {/* Tab Content Areas */}
            <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
              {bodyView === "edit" && (
                <textarea
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  className="w-full min-h-[600px] p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-y block"
                  placeholder="Enter HTML template here..."
                />
              )}

              {bodyView === "rendered" && (
                <iframe
                  srcDoc={formData.body}
                  className="w-full min-h-[600px] bg-white border-none block"
                  title="HTML Preview"
                />
              )}

              {bodyView === "plain" && (
                <pre className="p-4 min-h-[600px] overflow-y-auto bg-gray-50 font-sans text-sm text-gray-800 whitespace-pre-wrap m-0 block">
                  {htmlToPlainText(formData.body)}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Actions (Save / Cancel) */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => router.push("/dashboard/templates")}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md flex items-center gap-2 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        {/* AI Prompt Refinement Modal Component */}
        <AIPromptModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          channel={formData.channel}
          currentBody={formData.body}
          onGenerated={(generatedText) =>
            setFormData({ ...formData, body: generatedText })
          }
        />
      </div>
    </div>
  );
}
