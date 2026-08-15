"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Mail } from "lucide-react";

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
  status: "pending" | "sending" | "sent" | "failed" | "delivered" | "opened";
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "GET",
        });

        if (res.status === 401) {
          router.push("/");
          return;
        }
        const responseData = await res.json();

        if (res.ok && responseData.success) {
          setHistory(responseData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };

    // Poll history every 5 seconds
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 10000);

    const fetchDashboardData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
        };

        // Fetch department info
        const deptRes = await fetch(`/api/departments/me`, { headers });

        if (deptRes.status === 401 || deptRes.status === 403) {
          router.push("/");
          return;
        }

        const deptData = await deptRes.json();
        if (deptRes.ok) setDeptInfo(deptData.data);

        // Fetch templates count
        const tempRes = await fetch(`/api/templates`, { headers });
        const tempData = await tempRes.json();
        const templatesCount = tempRes.ok ? tempData.data.length : 0;

        // Fetch notifications count
        const notifRes = await fetch(`/api/notifications`, { headers });
        const notifData = await notifRes.json();
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

  // Filtering Logic for Search, Status, and Date Range
  const filteredNotifications = history.filter((item) => {
    // 1. Search Query Filter (Checks recipient address, subject, or ID)
    const matchesSearch =
      item.recipients?.some((r) =>
        r.address.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      item.renderedSubject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item._id.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Status Filter
    const matchesStatus =
      selectedStatus === "all" || item.status === selectedStatus;

    // 3. Date Range Filter
    let matchesDate = true;
    const itemDate = new Date(item.createdAt);
    const now = new Date();

    if (selectedDateRange === "today") {
      matchesDate = itemDate.toDateString() === now.toDateString();
    } else if (selectedDateRange === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      matchesDate = itemDate.toDateString() === yesterday.toDateString();
    } else if (selectedDateRange === "3days") {
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      matchesDate = itemDate >= threeDaysAgo;
    } else if (selectedDateRange === "15days") {
      const fifteenDaysAgo = new Date(now);
      fifteenDaysAgo.setDate(now.getDate() - 15);
      matchesDate = itemDate >= fifteenDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-center">
        <div className="inline-block relative">
          <h1 className="text-3xl font-bold text-blue-950 px-6 py-3 border-2 border-blue-900 rounded-full">
            {deptInfo?.name || "Unknown"}
          </h1>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex  justify-center gap-3 mt-4 md:mt-0">
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

      {/* --- NOTIFICATION HISTORY TABLE SECTION --- */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Notification History
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Real-time view of notifications status.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Bar */}
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Date & Status Filter Dropdowns */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="3days">Last 3 Days</option>
              <option value="15days">Last 15 Days</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="opened">Opened</option>
              <option value="failed">Failed</option>
              <option value="sending">Sending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {filteredNotifications.map((item) => (
                <tr
                  key={item._id}
                  onClick={() => router.push(`/dashboard/${item._id}`)}
                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  {/* --- SINGLE  RECIPIENT COLUMN --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-3">
                      {/* 1. Dynamic Status Icon Container */}
                      <div
                        className={`p-1.5 rounded-lg border ${
                          item.status === "opened"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : item.status === "delivered"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : item.status === "failed"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : item.status === "sending"
                                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                                  : item.status === "sent"
                                    ? "bg-gray-50 text-gray-600 border-gray-200"
                                    : "bg-yellow-50 text-yellow-600 border-yellow-200"
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                      </div>

                      {/* 2. First Email */}
                      <span className="truncate max-w-50 font-medium">
                        {item.recipients?.[0]?.address || "N/A"}
                      </span>

                      {/* 3. +19 Badge */}
                      {item.recipients?.length > 1 && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm">
                          +{item.recipients.length - 1}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* --- END OF RECIPIENT COLUMN --- */}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {item.renderedSubject || "No Subject"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 inline-flex items-center justify-center w-28 text-xs leading-5 font-semibold rounded-full capitalize ${
                        item.status === "opened"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "sent"
                              ? "bg-gray-100 text-gray-800"
                              : item.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : item.status === "sending"
                                  ? "bg-indigo-100 text-indigo-800"
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

              {filteredNotifications.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    No notifications found matching your filters.
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
