"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Template } from "@/types/template";

export default function TemplatesPage() {
  const router = useRouter();

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get the API key from localStorage
    const key = localStorage.getItem("demo_apiKey");

    // 2. Redirect to login if not found
    if (!key) {
      router.push("/");
      return;
    }

    // 3. Fetch templates
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates", {
          headers: { "x-api-key": key },
        });
        const data = await res.json();

        if (res.ok) {
          setTemplates(data.data || []);
        } else {
          setError(data.message || "Failed to fetch templates");
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
        setError("An unexpected error occurred while loading templates.");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [router]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Message Templates</h1>
        <Link
          href="/dashboard/templates/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          + Create Template
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600">Name</th>
              <th className="p-4 font-semibold text-gray-600">Channel</th>
              <th className="p-4 font-semibold text-gray-600">Subject</th>
              <th className="p-4 font-semibold text-gray-600">Created</th>
              <th className="p-4 font-semibold text-gray-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No templates found. Create one to get started.
                </td>
              </tr>
            ) : (
              templates.map((template) => (
                <tr key={template._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{template.name}</td>
                  <td className="p-4 uppercase text-xs tracking-wider">
                    <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                      {template.channel}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 truncate max-w-xs">
                    {template.subject || "N/A"}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(template.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {/* Link to view/edit the template - unwrapping params like Day 12 */}
                    <Link
                      href={`/dashboard/templates/${template._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View / Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
