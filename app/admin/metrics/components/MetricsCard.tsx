"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export type StatusKey =
  | "pending"
  | "sending"
  | "sent"
  | "delivered"
  | "opened"
  | "failed"
  | "retrying"
  | "cancelled";

export type DayBucket = {
  date: string;
} & Record<StatusKey, number>;

export interface SummaryMetrics {
  total: number;
  totalSent: number;
  deliverabilityRate: number;
}

export interface MetricDataset {
  summary: SummaryMetrics;
  timeline: DayBucket[];
}

interface StatusConfig {
  label: string;
  color: string;
}

// --- CONSTANTS ---
export const STATUS_STYLES: Record<StatusKey, StatusConfig> = {
  sent: { label: "Sent", color: "#374151" },
  delivered: { label: "Delivered", color: "#10b981" },
  opened: { label: "Opened", color: "#2563eb" },
  failed: { label: "Failed", color: "#ef4444" },
  sending: { label: "Sending", color: "#6366f1" },
  pending: { label: "Pending", color: "#eab308" },
  retrying: { label: "Retrying", color: "#818cf8" },
  cancelled: { label: "Cancelled", color: "#9ca3af" },
};

export const ALL_STATUS_KEYS = Object.keys(STATUS_STYLES) as StatusKey[];

// --- CUSTOM TOOLTIP ---
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
    const activeData = payload.filter((entry) => entry.value > 0);

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-50">
        <p className="mb-3 text-sm font-semibold text-gray-700 border-b pb-2">
          {label}
        </p>
        {activeData.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No notifications</p>
        ) : (
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

// --- MAIN COMPONENT ---
interface MetricsCardProps {
  title: string;
  dataset: MetricDataset;
  selectedEvents: StatusKey[];
  toggleEvent: (s: StatusKey | "all") => void;
  isAllSelected: boolean;
  activeStatuses: StatusKey[];
}

export default function MetricsCard({
  title,
  dataset,
  selectedEvents,
  toggleEvent,
  isAllSelected,
  activeStatuses,
}: MetricsCardProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
        {/* Title & Summary */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Total
              </p>
              <p className="mt-2 text-3xl font-semibold text-blue-900 tracking-tight">
                {dataset.summary.total ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                Deliverability
              </p>
              <p className="mt-2 text-3xl font-semibold text-blue-900 tracking-tight">
                {dataset.summary.deliverabilityRate ?? 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Custom Multi-Select Filter */}
        <div className="relative z-50">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>
              {isAllSelected
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
              />
            </svg>
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5">
              <button
                onClick={() => toggleEvent("all")}
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
                    />
                  </svg>
                )}
              </button>

              <div className="h-px bg-gray-200 my-1"></div>

              {ALL_STATUS_KEYS.map((status) => {
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
                        style={{ backgroundColor: STATUS_STYLES[status].color }}
                      ></span>
                      <span>{STATUS_STYLES[status].label}</span>
                    </div>
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
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* The Chart */}
      <div className="h-50 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataset.timeline ?? []}>
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

      {/* Footer Summary */}
      {dataset.summary.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-gray-100 pt-6 pb-2">
          {activeStatuses.map((status) => {
            const totalForStatus = dataset.timeline.reduce(
              (sum, day) => sum + (day[status] || 0),
              0,
            );
            if (totalForStatus === 0) return null;
            const percentage = Math.round(
              (totalForStatus / dataset.summary.total) * 100,
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
  );
}
