"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

// Définition du type basé sur ton modèle Mongoose
interface Department {
  _id: string;
  name: string;
  contactEmail: string;
  allowedChannels: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string; // Pour afficher la dernière action
}

export default function DepartmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string; // Récupère l'ID depuis l'URL

  const [department, setDepartment] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  if (isLoading)
    return <div className="p-8 text-center">Loading department details...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!department) return <div className="p-8">Department not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-500 hover:underline"
      >
        ← Back to Departments
      </button>

      <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4">{department.name}</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">
              {department.active ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-600">Inactive</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact Email</p>
            <p className="font-medium">{department.contactEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Allowed Channels</p>
            <p className="font-medium">
              {department.allowedChannels.join(", ")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Department ID</p>
            <p className="font-medium text-xs bg-gray-100 p-1 rounded inline-block">
              {department._id}
            </p>
          </div>
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
