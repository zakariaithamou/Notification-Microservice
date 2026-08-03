"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DepartmentInfo {
  _id: string;
  name: string;
  contactEmail: string;
  allowedChannels: string[];
  active: boolean;
}
type Recipient = {
  address: string;
};

type NotificationItem = {
  _id: string;
  recipients: Recipient[];
  renderedSubject?: string;
  renderedBody?: string;
  status: "pending" | "sending" | "sent" | "failed";
  lastError?: string;
  attempts?: number;
  maxAttempts?: number;
  createdAt: string | Date;
  sentAt?: string | Date;
};

export default function DashboardOverview() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deptInfo, setDeptInfo] = useState<DepartmentInfo | null>(null);
  const [stats, setStats] = useState({ templates: 0, notifications: 0 });
  const [history, setHistory] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const deptId = localStorage.getItem("demo_departmentId");
    const apiKey = localStorage.getItem("demo_apiKey");

    if (!deptId || !apiKey) {
      router.push("/");
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
          headers: { "x-api-key": apiKey },
        });
        const responseData = await res.json();

        if (res.ok && responseData.success) {
          setHistory(responseData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    // Set up silent polling every 5 seconds for real-time UI updates
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 5000);

    const fetchDashboardData = async () => {
      try {
        const headers = {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        };

        // 1. Fetch Department Info
        const deptRes = await fetch(`/api/departments/${deptId}`, { headers });
        const deptData = await deptRes.json();
        if (deptRes.ok) setDeptInfo(deptData.data);

        // 2. Fetch Templates to get count
        const tempRes = await fetch(`/api/templates`, { headers });
        const tempData = await tempRes.json();
        const templatesCount = tempRes.ok ? tempData.data.length : 0;

        // 3. Fetch Notifications to get count
        const notifRes = await fetch(`/api/notifications`, { headers });
        const notifData = await notifRes.json();
        // Handling your specific 404/NOT_FOUND_ERROR if array is 0
        const notificationsCount = notifRes.ok ? notifData.data.length : 0;

        setStats({
          templates: templatesCount,
          notifications: notificationsCount,
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    fetchHistory();
    return () => clearInterval(intervalId);
  }, [router]);

  if (loading) {
    return (
      <div className="text-gray-500 animate-pulse">
        Loading secure dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Department Overview
        </h1>
        <p className="mt-2 text-gray-600">
          Connected as{" "}
          <span className="font-semibold text-blue-600">
            {deptInfo?.name || "Unknown"}
          </span>
        </p>
      </div>
      {/* Quick Action Buttons */}
      <div className="flex gap-3 mt-4 md:mt-0">
        <Link
          href="/dashboard/templates"
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          + Create Template
        </Link>
        <Link
          href="/dashboard/notifications"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          Send Notification
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Identity Details
          </h2>
          <div className="space-y-3 text-sm">
            <p>
              <strong className="text-gray-600">ID:</strong> {deptInfo?._id}
            </p>
            <p>
              <strong className="text-gray-600">Email:</strong>{" "}
              {deptInfo?.contactEmail}
            </p>
            <p>
              <strong className="text-gray-600">Channels:</strong>{" "}
              {deptInfo?.allowedChannels?.join(", ") || "None"}
            </p>
            <p>
              <strong className="text-gray-600">Status:</strong>{" "}
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${deptInfo?.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {deptInfo?.active ? "Active" : "Inactive"}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">
                Total Templates
              </p>
              <p className="text-4xl font-bold text-blue-600">
                {stats.templates}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm font-medium text-slate-500 mb-1">
                Messages Sent
              </p>
              <p className="text-4xl font-bold text-emerald-600">
                {stats.notifications}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* --- NOTIFICATION HISTORY TABLE --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Notification History
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Real-time view of notifications status.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient(s)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => router.push(`/dashboard/${item._id}`)}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    ...{item._id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.recipients?.map((r) => r.address).join(", ") || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {item.renderedSubject || "No Subject"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        item.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : item.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : item.status === "sending"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No notifications found in the queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
