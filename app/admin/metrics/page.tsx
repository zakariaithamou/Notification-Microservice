"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import MetricsCard, {
  StatusKey,
  ALL_STATUS_KEYS,
  MetricDataset,
} from "./components/MetricsCard";

// --- TYPES ---
type Channel = "all" | "email" | "sms" | "push" | "whatsapp";

interface DepartmentMetric extends MetricDataset {
  _id: string;
  name: string;
}

interface MetricsResponseData {
  global: MetricDataset;
  departments: DepartmentMetric[];
}

interface ApiResponse {
  success: boolean;
  data?: MetricsResponseData;
  message?: string;
}

// --- CONSTANTS ---
const DAY_OPTIONS: readonly number[] = [7, 15, 30, 90];
const CHANNEL_OPTIONS: ReadonlyArray<{ value: Channel; label: string }> = [
  { value: "all", label: "All channels" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "whatsapp", label: "WhatsApp" },
];

function isChannel(value: string): value is Channel {
  return CHANNEL_OPTIONS.some((option) => option.value === value);
}

// --- MAIN PAGE COMPONENT ---
export default function AdminMetricsPage() {
  const router = useRouter();

  // Filters State
  const [days, setDays] = useState<number>(15);
  const [channel, setChannel] = useState<Channel>("all");

  // Data State
  const [data, setData] = useState<MetricsResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global Chart Status State (applies to all charts)
  const [selectedEvents, setSelectedEvents] =
    useState<StatusKey[]>(ALL_STATUS_KEYS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/admin/metrics?days=${days}&channel=${channel}`,
          { cache: "no-store" },
        );

        if (res.status === 401 || res.status === 403) {
          router.push("/admin/login");
          return;
        }

        const responseData: ApiResponse = await res.json();

        if (res.ok && responseData.success && responseData.data) {
          setData(responseData.data);
        } else {
          setError(responseData.message ?? "Failed to load metrics.");
        }
      } catch (err: unknown) {
        console.error("Failed to fetch metrics", err);
        setError("Failed to load metrics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days, channel, router]);

  // Handlers
  const handleChannelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (isChannel(val)) setChannel(val);
  };

  const handleDaysChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) setDays(val);
  };

  // Helper to toggle statuses for all charts
  const toggleEvent = (status: StatusKey | "all") => {
    if (status === "all") {
      setSelectedEvents(ALL_STATUS_KEYS);
      return;
    }

    setSelectedEvents((prev) => {
      if (prev.length === ALL_STATUS_KEYS.length) return [status];
      if (prev.includes(status)) {
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  const activeStatuses = ALL_STATUS_KEYS.filter((status) =>
    selectedEvents.includes(status),
  );
  const isAllSelected = selectedEvents.length === ALL_STATUS_KEYS.length;

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">Loading ...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-14 py-10">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-blue-900 tracking-tight">
            Metrics
          </h1>

          {/* Dynamic Filters Area */}
          <div className="flex flex-wrap gap-3">
            <select
              value={channel}
              onChange={handleChannelChange}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={days}
              onChange={handleDaysChange}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 shadow-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  Last {d} days
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 1. RENDER GLOBAL CHART */}
        {data && (
          <MetricsCard
            title="Global Notifications"
            dataset={data.global}
            selectedEvents={selectedEvents}
            toggleEvent={toggleEvent}
            isAllSelected={isAllSelected}
            activeStatuses={activeStatuses}
          />
        )}

        {/* 2. RENDER DEPARTMENT CHARTS BELOW IT */}
        {data && data.departments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-2">
              Department
            </h2>
            <div className="grid  grid-cols-1 xl:grid-cols-2 gap-6">
              {data.departments.map((dept) => (
                <MetricsCard
                  key={dept._id}
                  title={dept.name}
                  dataset={dept}
                  selectedEvents={selectedEvents}
                  toggleEvent={toggleEvent}
                  isAllSelected={isAllSelected}
                  activeStatuses={activeStatuses}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
