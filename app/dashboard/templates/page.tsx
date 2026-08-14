"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Template } from "@/types/template";
import { Edit, Trash2, AlertTriangle } from "lucide-react";

export default function TemplatesPage() {
  const router = useRouter();

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Open Modal
  const handleDeleteClick = (template: Template) => {
    setTemplateToDelete(template);
    setIsModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/templates/${templateToDelete._id}`, {
        method: "DELETE",
      });

      // Catch unauthorized errors to redirect
      if (response.status === 401) {
        router.push("/");
        return;
      }

      if (response.ok) {
        setIsModalOpen(false);
        setSuccessMsg("Template deleted successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);

        // Instantly remove the deleted template from the table without refreshing the page
        setTemplates((prev) =>
          prev.filter((t) => t._id !== templateToDelete._id),
        );
        setTemplateToDelete(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates");

        if (res.status === 401) {
          router.push("/");
          return;
        }
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Success Message Banner */}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 border border-green-200 rounded-md shadow-sm">
          {successMsg}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Message Templates</h1>

        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-3 text-sm  text-gray-700 focus:outline-none  focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="single">Single</option>
            <option value="diffusion">Diffusion</option>
          </select>
          <Link
            href="/dashboard/templates/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md transition-colors"
          >
            + Create Template
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold text-gray-600 text-center">
                Name
              </th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Type
              </th>
              <th className="p-4 font-semibold text-gray-600">Channel</th>
              <th className="p-4 font-semibold text-gray-600 text-center">
                Subject
              </th>
              <th className="p-4 font-semibold text-gray-600">Created</th>
              <th className="p-4 font-semibold text-gray-600  text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {templates.filter(
              (t) => filterType === "all" || t.templateType === filterType,
            ).length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No templates found matching this filter.
                </td>
              </tr>
            ) : (
              templates
                .filter(
                  (t) => filterType === "all" || t.templateType === filterType,
                )
                .map((template) => (
                  <tr key={template._id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{template.name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize inline-block text-center w-28 ${
                          template.templateType === "diffusion"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {template.templateType || "single"}
                      </span>
                    </td>
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
                      <div className="flex items-center justify-end gap-4">
                        {/* Update Button */}
                        <Link
                          href={`/dashboard/templates/${template._id}`}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors font-medium"
                        >
                          <Edit size={16} />
                          <span>Update</span>
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(template)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors font-medium"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {isModalOpen && templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Delete Template?</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this template? This action cannot
              be undone.
            </p>

            <div className="bg-gray-50 p-4 rounded border mb-6 text-left">
              <p>
                <strong className="inline-block w-24">Name</strong>
                <strong className="w-4">:</strong> {templateToDelete.name}
              </p>
              <p>
                <strong className="inline-block w-24">Channel</strong>
                <strong className="w-4">:</strong>{" "}
                <span className="capitalize">{templateToDelete.channel}</span>
              </p>
              <p>
                <strong className="inline-block w-24">Type</strong>
                <strong className="w-4">:</strong>{" "}
                <span className="capitalize">
                  {templateToDelete.templateType || "single"}
                </span>
              </p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeleting}
                className="px-12 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-12 py-2 text-white bg-red-600 hover:bg-red-700 rounded flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
