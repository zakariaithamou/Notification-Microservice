"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type Channel = "all" | "email" | "sms" | "push" | "whatsapp";

type StatusKey =
  | "pending"
  | "sending"
  | "sent"
  | "delivered"
  | "opened"
  | "failed"
  | "retrying"
  | "cancelled";

type EventFilter = "all" | StatusKey;

type DayBucket = {
  date: string;
} & Record<StatusKey, number>;

interface SummaryMetrics {
  total: number;
  totalSent: number;
  deliverabilityRate: number;
}

interface MetricsResponseData {
  summary: SummaryMetrics;
  timeline: DayBucket[];
}

interface ApiResponse {
  success: boolean;
  data?: MetricsResponseData;
  message?: string;
}

interface StatusConfig {
  label: string;
  color: string;
}

const STATUS_STYLES: Record<StatusKey, StatusConfig> = {
  sent: { label: "Sent", color: "#374151" },
  delivered: { label: "Delivered", color: "#10b981" },
  opened: { label: "Opened", color: "#2563eb" },
  failed: { label: "Failed", color: "#ef4444" },
  sending: { label: "Sending", color: "#6366f1" },
  pending: { label: "Pending", color: "#eab308" },
  retrying: { label: "Retrying", color: "#818cf8" },
  cancelled: { label: "Cancelled", color: "#9ca3af" },
};

const ALL_STATUS_KEYS = Object.keys(STATUS_STYLES) as StatusKey[];

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

function isEventFilter(value: string): value is EventFilter {
  return value === "all" || ALL_STATUS_KEYS.includes(value as StatusKey);
}

interface TooltipPayload {
  value: number;
  name: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload) {
    // 1. Filter out any statuses that have 0 notifications
    const activeData = payload.filter((entry) => entry.value > 0);

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        {/* The Date (e.g., Aug 07) */}
        <p className="mb-3 text-sm font-semibold text-gray-700 border-b pb-2">
          {label}
        </p>

        {/* 2. If everything is 0, show the fallback message */}
        {activeData.length === 0 ? (
          <p className="text-sm text-gray-500 italic">no email sent</p>
        ) : (
          /* 3. Otherwise, map through only the non-zero statuses */
          <div className="flex flex-col gap-1.5">
            {activeData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-gray-600 font-medium">{entry.name}:</span>
                <span className="font-bold text-gray-900">{entry.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function MetricsPage() {
  const router = useRouter();

  const [days, setDays] = useState<number>(15);
  const [channel, setChannel] = useState<Channel>("all");

  const [data, setData] = useState<MetricsResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] =
    useState<StatusKey[]>(ALL_STATUS_KEYS);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    // 1. Check Auth
    const apiKey = localStorage.getItem("demo_apiKey");
    if (!apiKey) {
      router.push("/");
      return;
    }

    // 2. Define the async fetch
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/notifications/metrics?days=${days}&channel=${channel}`,
          {
            method: "GET",
            headers: { "x-api-key": apiKey },
            cache: "no-store",
          },
        );

        const responseData: ApiResponse = await res.json();

        // 3. All state updates happen asyn
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

  const handleChannelChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (isChannel(val)) {
      setChannel(val);
      setLoading(true);
      setError(null);
    }
  };

  const handleDaysChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setDays(val);
      setLoading(true);
      setError(null);
    }
  };

  // Toggles a single status button on/off
  const toggleEvent = (status: StatusKey) => {
    setSelectedEvents((prev) => {
      // If "All Events" is currently active, clicking a specific status should isolate just that one
      if (prev.length === ALL_STATUS_KEYS.length) {
        return [status];
      }

      // Otherwise, toggle it normally
      if (prev.includes(status)) {
        // Prevent unchecking the very last item 
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== status);
      }

      return [...prev, status];
    });
  };

  const activeStatuses = ALL_STATUS_KEYS.filter((status) =>
    selectedEvents.includes(status),
  );

  // Helper variable to know if we are in "All Events" mode
  const isAllSelected = selectedEvents.length === ALL_STATUS_KEYS.length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-blue-900 tracking-tight">
            Metrics
          </h1>

          <div className="flex gap-3">
            <select
              value={channel}
              onChange={handleChannelChange}
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
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
              className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
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

        {/* Chart Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-8">
            <div className="flex gap-12">
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Notifications
                </p>
                <p className="mt-2 text-4xl font-semibold text-blue-900 tracking-tight">
                  {data?.summary.total ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                  Deliverability Rate
                </p>
                <p className="mt-2 text-4xl font-semibold text-blue-900 tracking-tight">
                  {data?.summary.deliverabilityRate ?? 0}%
                </p>
              </div>
            </div>

            {/* Event Type Filter */}
            {/* Custom Multi-Select Filter */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
              >
                <span>
                  {selectedEvents.length === ALL_STATUS_KEYS.length
                    ? "All Events"
                    : `${selectedEvents.length} selected`}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

             
              {/* Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5">
                  {/* All Events Toggle */}
                  <button
                    onClick={() => setSelectedEvents(ALL_STATUS_KEYS)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full border-[2px] border-gray-600"></div>
                      <span>All Events</span>
                    </div>
                   
                    {isAllSelected && (
                      <svg
                        className="w-4 h-4 text-gray-900"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    )}
                  </button>

                  <div className="h-px bg-gray-200 my-1"></div>

                  {/* Individual Statuses */}
                  {ALL_STATUS_KEYS.map((status) => {
                    // Individual items are only considered "checked" if  NOT in All Events mode
                    const isSelected =
                      !isAllSelected && selectedEvents.includes(status);

                    return (
                      <button
                        key={status}
                        onClick={() => toggleEvent(status)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: STATUS_STYLES[status].color,
                            }}
                          ></span>
                          <span>{STATUS_STYLES[status].label}</span>
                        </div>

                        {/*  Individual checkmarks only show when isolating specific statuses */}
                        {isSelected && (
                          <svg
                            className="w-4 h-4 text-gray-900"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.timeline ?? []}>
                <CartesianGrid
                  strokeDasharray="2 2"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  dx={10}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#e5e7eb",
                    strokeWidth: 1,
                    fill: "transparent",
                  }}
                />
                {activeStatuses.map((status) => (
                  <Area
                    key={status}
                    type="monotone"
                    dataKey={status}
                    name={STATUS_STYLES[status].label}
                    stroke={STATUS_STYLES[status].color}
                    fill={STATUS_STYLES[status].color}
                    fillOpacity={0.06}
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* FOOTER SUMMARY */}
          {data && data.summary.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 pt-6 pb-2">
              {activeStatuses.map((status) => {
                // 1. Sum up all notifications for this specific status across the whole timeline
                const totalForStatus = data.timeline.reduce(
                  (sum, day) => sum + (day[status] || 0),
                  0,
                );

                // 2. Skip rendering if the status has 0 notifications
                if (totalForStatus === 0) return null;

                // 3. Calculate the percentage relative to total notifications
                const percentage = Math.round(
                  (totalForStatus / data.summary.total) * 100,
                );

                return (
                  <div
                    key={status}
                    className="flex items-center gap-2"
                    title={`${STATUS_STYLES[status].label}: ${totalForStatus} total`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_STYLES[status].color }}
                    ></span>
                    <span className="text-sm font-medium text-gray-700">
                      {percentage}%
                      {/* Optional: Remove the span below if you strictly want ONLY the numbers like the image */}
                      <span className="hidden sm:inline-block text-gray-400 font-normal ml-1">
                        {STATUS_STYLES[status].label}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
