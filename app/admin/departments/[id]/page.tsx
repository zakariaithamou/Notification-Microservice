"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { Copy, Check, ArrowLeft } from "lucide-react";

// Department shape
interface Department {
  _id: string;
  name: string;
  contactEmail: string;
  allowedChannels: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string; // Last activity timestamp
}

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // Route parameter

  const [department, setDepartment] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Editable form state
  const [contactEmail, setContactEmail] = useState<string>("");
  const [allowedChannels, setAllowedChannels] = useState<string[]>([]);
  const [active, setActive] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const fetchDepartmentDetails = async () => {
      try {
        const adminToken = localStorage.getItem("admin_token");
        if (!adminToken) {
          router.push("/admin/login");
          return;
        }

        const res = await fetch(`/api/departments/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": adminToken,
          },
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to fetch department details");
        }

        setDepartment(json.data);

        setContactEmail(json.data.contactEmail);
        setAllowedChannels(json.data.allowedChannels);
        setActive(json.data.active);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentDetails();
  }, [id, router]);

  const hasChanges =
    contactEmail !== department?.contactEmail ||
    active !== department?.active ||
    JSON.stringify(allowedChannels) !==
      JSON.stringify(department?.allowedChannels);
  const handleChannelToggle = (channel: string) => {
    setAllowedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const adminToken = localStorage.getItem("admin_token");
      if (!adminToken) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch(`/api/departments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": adminToken,
        },
        body: JSON.stringify({ contactEmail, allowedChannels, active }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update department");
      }

      setDepartment(json.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError("An unexpected error occurred");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!department) return;
    setContactEmail(department.contactEmail);
    setAllowedChannels(department.allowedChannels);
    setActive(department.active);
    setSaveError(null);
    setSaveSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!department) return <div className="p-8">Department not found.</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-50 bg-blue-900 border border-blue-100 rounded-lg hover:bg-blue-800 hover:border-blue-800 transition-all duration-200"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4">{department.name}</h1>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1"> ID</p>

              <div className="flex items-center justify-between bg-gray-100 px-8 py-2 rounded-lg">
                <span className="font-medium text-base">{department._id}</span>

                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(department._id);
                    setCopied(true);

                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-900 rounded transition-colors"
                  title={copied ? "Copied" : "Copy ID"}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-base text-gray-500 mb-1">Contact Email</p>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-base text-gray-500 mb-1">Status</p>

              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActive(true)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Enabled
                </button>

                <button
                  type="button"
                  onClick={() => setActive(false)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    !active
                      ? "bg-gray-600 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Disabled
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-base text-gray-500 mb-1">Allowed Channels</p>
            <div className="flex gap-4">
              {["email", "sms", "push", "whatsapp"].map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-1 text-base"
                >
                  <input
                    type="checkbox"
                    checked={allowedChannels.includes(channel)}
                    onChange={() => handleChannelToggle(channel)}
                  />
                  {channel}
                </label>
              ))}
            </div>
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-600 mb-3 text-center">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-green-600 mb-3 text-center">
            Changes saved successfully.
          </p>
        )}

        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-6 py-2 text-base rounded transition-colors ${
              hasChanges && !isSaving
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 text-base bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-4"> Activity</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500 mb-1">Created At</p>
            <p className="font-medium">
              {new Date(department.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded border border-blue-100">
            <p className="text-sm text-blue-600 mb-1">Last Update</p>
            <p className="font-medium text-blue-900">
              {new Date(department.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
