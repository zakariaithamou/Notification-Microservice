"use client";

import React from "react";
import { Clock, Send, CheckCircle2, Mail, AlertTriangle } from "lucide-react";

interface TimelineProps {
  status: string;
  createdAt: string | Date;
  sentAt?: string | Date;
  deliveredAt?: string | Date;
  openedAt?: string | Date;
  failedAt?: string | Date;
}

export default function EmailEventsTimeline({
  status,
  createdAt,
  sentAt,
  deliveredAt,
  openedAt,
  failedAt,
}: TimelineProps) {
  // Helper to format dates cleanly (e.g. "Aug 03, 1:04 PM")
  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return null;
    return new Date(dateInput).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // The 4 chronological steps with waterfall
  const steps = [
    {
      id: "queued",
      label: "Queued",
      icon: Clock,
      date: formatDate(createdAt),
      isCompleted: Boolean(createdAt),
      badgeStyle: "bg-purple-100 text-purple-700",
    },
    {
      id: "sent",
      label: "Sent",
      icon: Send,
      date: formatDate(sentAt || createdAt), // Fallback to createdAt if sentAt is missing
      isCompleted:
        Boolean(sentAt) ||
        Boolean(deliveredAt) ||
        Boolean(openedAt) ||
        status === "sent" ||
        status === "delivered" ||
        status === "opened",
      badgeStyle: "bg-gray-100 text-gray-700",
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: CheckCircle2,
      date: formatDate(deliveredAt),
      isCompleted:
        Boolean(deliveredAt) ||
        Boolean(openedAt) ||
        status === "delivered" ||
        status === "opened",
      badgeStyle: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "opened",
      label: "Opened",
      icon: Mail,
      date: formatDate(openedAt),
      isCompleted: Boolean(openedAt) || status === "opened",
      badgeStyle: "bg-blue-100 text-blue-700",
    },
  ];

  // If delivery failed, overwrite the final step with the error state
  if (status === "failed" || failedAt) {
    steps[3] = {
      id: "failed",
      label: "Failed",
      icon: AlertTriangle,
      date: formatDate(failedAt || sentAt),
      isCompleted: true,
      badgeStyle: "bg-red-100 text-red-700",
    };
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Dotted container background */}
      <div
        className="relative p-4"
        style={{
          backgroundImage: "radial-gradient(#e5e7eb 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="flex items-center justify-start min-w-600px">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                {/* Event Node */}
                <div className="flex flex-col items-center gap-3 w-24">
                  {/* Icon Card */}

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm transition-all duration-300 ${
                      step.isCompleted
                        ? `${step.badgeStyle} border-current/20`
                        : "bg-white border-gray-100 text-gray-300"
                    }`}
                  >
                    <IconComponent
                      className="h-5 w-5"
                      strokeWidth={step.isCompleted ? 2 : 1.5}
                    />
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors ${
                      step.isCompleted
                        ? step.badgeStyle
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Date Label */}
                  <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                    {step.date || "--"}
                  </span>
                </div>

                {/* Connecting Horizontal Line */}
                {!isLast && (
                  <div className="relative flex-1 h-[2px] mx-[-12px] mb-[52px] bg-gray-200">
                    <div
                      className={`absolute inset-0 h-full transition-all duration-500 ${
                        steps[index + 1].isCompleted
                          ? "bg-gray-600 w-full"
                          : "w-0"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
