"use client";

import React, { useState } from "react";
import {
  Sparkles,
  History as HistoryIcon,
  X,
  Loader2,
  Bot,
} from "lucide-react";

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: "email" | "sms" | "push" | "whatsapp";
  currentBody?: string;
  onGenerated: (generatedText: string) => void;
}

export default function AIPromptModal({
  isOpen,
  onClose,
  channel,
  currentBody,
  onGenerated,
}: AIPromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showHistory, setShowHistory] = useState<boolean>(false);

  // History State

  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ai_prompt_history");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.slice(-20) : [];
    } catch (e) {
      console.error("Failed to parse prompt history:", e);
      return [];
    }
  });

  // Helper function to store up to 5 unique recent prompts
  const saveToHistory = (newPrompt: string) => {
    const updated = [
      newPrompt,
      ...history.filter((p) => p !== newPrompt),
    ].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("ai_prompt_history", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/templates/generate-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": localStorage.getItem("demo_apiKey") || "",
        },
        body: JSON.stringify({
          prompt,
          channel,
          currentBody: currentBody || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate template.");
      }
      saveToHistory(prompt);
      onGenerated(data.body);
      setPrompt("");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-blue-900/20 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        {/* Header */}

        <div className="flex justify-between items-center bg-blue-950 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
            <h3 className="text-base font-semibold tracking-wide">
              {currentBody
                ? "Refine Template with AI"
                : "Generate Template with AI"}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* History Toggle Button */}
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                showHistory
                  ? "bg-blue-800 text-white"
                  : "text-blue-200 hover:text-white hover:bg-blue-900/50"
              }`}
              title="Prompt History"
            >
              <HistoryIcon className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-blue-200 hover:text-white hover:bg-blue-900/50 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Prompt History Panel Drawer */}
        {showHistory && (
          <div className="bg-blue-50/90 border-b border-blue-100 p-4 px-6 text-xs text-blue-950">
            <p className="font-bold uppercase tracking-wider mb-2 text-blue-900">
              Recent Prompts:
            </p>
            {history.length === 0 ? (
              <p className="text-slate-500 italic">
                No previous prompts saved yet.
              </p>
            ) : (
              <div className="space-y-1.5">
                {history.map((pastPrompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(pastPrompt);
                      setShowHistory(false);
                    }}
                    className="block w-full text-left truncate bg-white hover:bg-blue-100 p-2 rounded border border-blue-200/60 transition"
                  >
                    &quot;{pastPrompt}&quot;
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900 bg-blue-50/80 px-3 py-2 rounded-md border border-blue-100">
            <span> CHANNEL:</span>
            <span className="uppercase tracking-wider px-2 py-0.5 bg-blue-950 text-white rounded text-[11px]">
              {channel}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            /* Active AI Working Animation Banner */
            <div className="border-2 border-blue-900/20 rounded-xl p-8 bg-blue-50/50 flex flex-col items-center justify-center gap-3 animate-pulse">
              <div className="p-3 bg-blue-950 rounded-full text-blue-300 shadow-lg ring-4 ring-blue-100">
                <Bot className="w-8 h-8 animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-blue-950">
                  Gemini AI is crafting your template...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Applying Handlebars variables and formatting for{" "}
                  <span className="font-semibold uppercase text-blue-900">
                    {channel}
                  </span>
                </p>
              </div>
              {/* Animated Shimmer Progress Line */}
              <div className="w-48 h-1.5 bg-blue-200 rounded-full overflow-hidden mt-2">
                <div className="w-full h-full bg-blue-950 animate-pulse"></div>
              </div>
            </div>
          ) : (
            /* Standard Input Textarea */
            <div>
              <label className="block text-xs font-bold text-blue-950 uppercase tracking-wider mb-2">
                Prompt Description
              </label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  currentBody
                    ? "e.g., Make it more formal and add a reminder about late payment fees."
                    : "e.g., Send a welcome email to a new student who just enrolled. Include a link to access their portal."
                }
                className="w-full border-2 border-blue-900/30 text-blue-950 rounded-lg p-3.5 text-sm focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 focus:outline-none placeholder:text-slate-400 font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
                <span>Describe what the AI should generate.</span>
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-slate-300 text-slate-600 hover:text-blue-950 hover:bg-slate-400 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="group px-5 py-2 text-sm text-white bg-blue-950 hover:bg-blue-900 active:bg-blue-950 rounded-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-200" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-300 animate-pulse group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300" />
                  <span>{currentBody ? "Refine " : "Generate "}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
