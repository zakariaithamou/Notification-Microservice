"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react"; // Required for Next.js 15 params unwrapping

// 1. Define the type
type Recipient = { address: string };
type NotificationItem = {
  _id: string;
  recipients: Recipient[];
  renderedSubject?: string;
  renderedBody?: string;
  status: "pending" | "sending" | "sent" | "failed";
  lastError?: string;
  createdAt: string | Date;
};

// 2. The Page Component
export default function NotificationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params); // Unwrap the ID from the URL

  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const apiKey = localStorage.getItem("demo_apiKey");
      if (!apiKey) {
        router.push("/");
        return;
      }

      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "GET",
          headers: { "x-api-key": apiKey },
        });
        const responseData = await res.json();

        if (res.ok && responseData.success) {
          setNotification(responseData.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          Notification Not Found
        </h2>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 text-blue-600 hover:underline"
        >
          Go back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notification Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              ID: {notification._id}
            </p>
          </div>
          <span
            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
            ${
              notification.status === "sent"
                ? "bg-green-100 text-green-800"
                : notification.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : notification.status === "sending"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {notification.status}
          </span>
        </div>

        {/* Failed Error Banner */}
        {notification.status === "failed" && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mb-4">
            <p className="text-sm text-red-700 font-bold">Delivery Failed</p>
            <p className="text-sm text-red-600 mt-1">
              Reason: {notification.lastError || "Unknown error"}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(notification.createdAt).toLocaleString()}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recipients</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 wrap-break-word">
                {notification.recipients.map((r) => r.address).join(", ")}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subject</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                {notification.renderedSubject}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Message Body
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div
                  className="bg-gray-50 p-4 rounded border border-gray-200 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: notification.renderedBody || "No content.",
                  }}
                />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
