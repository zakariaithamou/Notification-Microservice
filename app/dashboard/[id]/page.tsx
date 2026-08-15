"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import EmailEventsTimeline from "./components/EmailEventsTimeline";
import { formatHtml, htmlToPlainText } from "@/lib/htmlHelpers";
import { Copy, Check, ChevronRight, ArrowLeft } from "lucide-react";

// Notification shape updated with timeline timestamps and webhook statuses
type Recipient = { address: string };
type NotificationItem = {
  _id: string;
  recipients: Recipient[];
  renderedSubject?: string;
  renderedBody?: string;
  status: "pending" | "sending" | "sent" | "delivered" | "opened" | "failed";
  lastError?: string;
  createdAt: string | Date;
  sentAt?: string | Date;
  deliveredAt?: string | Date;
  openedAt?: string | Date;
  failedAt?: string | Date;
  providerId?: {
    id: string;
    email: string;
    status: string;
    deliveredAt?: string;
    openedAt?: string;
    failedAt?: string;
    failedDetails?: {
      type: string;
      subType: string;
      message: string;
      suggestedActions?: string[];
    };
  }[];
};

// Page component
export default function NotificationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [notification, setNotification] = useState<NotificationItem | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [bodyView, setBodyView] = useState<"preview" | "html" | "text">(
    "preview",
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/notifications/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (res.status === 401) {
          router.push("/");
          return;
        }

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-900 rounded-full animate-spin"></div>

        <span className="text-sm text-gray-500">Loading...</span>
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
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-50 bg-blue-900 border border-blue-100 rounded-lg hover:bg-blue-800 hover:border-blue-800 transition-all duration-200"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Page title */}
      <h1 className="text-2xl text-center font-bold mb-6">
        Notification Details
      </h1>

      {/* Information box */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex items-center justify-between  ">
          <span className="bg-gray-100 px-6 py-2 rounded-md text-base text-gray-600 gap-4">
            ID: {notification._id}
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(notification._id);
                setCopied(true);

                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1 text-gray-500 hover:text-blue-900 rounded transition-colors"
              title={copied ? "Copied" : "Copy ID"}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </span>

          <span
            className={`px-3 py-1 inline-flex text-base leading-5 font-semibold rounded-full capitalize
            ${
              notification.status === "opened"
                ? "bg-green-100 text-blue-800"
                : notification.status === "delivered"
                  ? "bg-emerald-100 text-emerald-800"
                  : notification.status === "sent"
                    ? "bg-blue-100 text-gray-800"
                    : notification.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {notification.status}
          </span>
        </div>

        {/* Summary Info Block */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-medium text-gray-500">
                Created At
              </dt>
              <dd className="mt-1 text-base text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(notification.createdAt).toLocaleString()}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-medium text-gray-500">Subject</dt>
              <dd className="mt-1 text-base text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                {notification.renderedSubject}
              </dd>
            </div>

            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-medium text-gray-500">
                Recipients
              </dt>
              <dd className="mt-1 text-base text-gray-900 sm:mt-0 sm:col-span-2 wrap-break-word">
                {notification.recipients[0]?.address}
                {notification.recipients.length > 1 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    +{notification.recipients.length - 1}
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* Failed Error Banner */}
        {notification.status === "failed" && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mb-4">
            <p className="text-sm text-red-700 font-bold">Delivery Failed</p>

            {notification.providerId
              ?.filter((p) => p.status === "failed" && p.failedDetails)
              .map((p, i) => (
                <div
                  key={i}
                  className={
                    i > 0 ? "mt-4 pt-4 border-t border-red-200" : "mt-1"
                  }
                >
                  <p className="text-sm text-red-600">{p.email}</p>
                  <p className="text-sm text-red-600 mt-1">
                    {p.failedDetails?.message}
                  </p>

                  {p.failedDetails?.suggestedActions &&
                    p.failedDetails.suggestedActions.length > 0 && (
                      <div className="mt-3 bg-blue-50 rounded-md p-3">
                        <p className="text-sm text-blue-800 font-semibold">
                          Suggested Actions
                        </p>
                        <ul className="list-disc pl-14 text-sm text-blue-700 mt-2 space-y-2">
                          {p.failedDetails.suggestedActions.map((action, j) => (
                            <li key={j}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ))}
          </div>
        )}

        {/* Timeline Section */}
        {/* Timeline Section for Single Recipient Notifications */}
        {notification.recipients.length === 1 && (
          <div className="border-t border-gray-200 px-6 pt-6">
            <h4 className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-3">
              Email Event
            </h4>
            <div className="bg-gray-50/50 p-6 mx-6 mb-6 rounded-md">
              <EmailEventsTimeline
                status={
                  notification.providerId?.[0]?.status || notification.status
                }
                createdAt={notification.createdAt}
                sentAt={notification.sentAt || notification.createdAt}
                deliveredAt={
                  notification.providerId?.[0]?.deliveredAt ||
                  notification.deliveredAt
                }
                openedAt={
                  notification.providerId?.[0]?.openedAt ||
                  notification.openedAt
                }
                failedAt={
                  notification.providerId?.[0]?.failedAt ||
                  notification.failedAt
                }
              />
            </div>
          </div>
        )}

        {/* Email Events List */}
        {notification.recipients.length > 1 &&
          notification.providerId &&
          notification.providerId.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <h4 className="text-base font-semibold text-gray-500 tracking-wide uppercase mb-3">
                Email Events
              </h4>
              <div className="divide-y divide-gray-200 border-t border-gray-200">
                {notification.providerId.map((p, i) => {
                  const isExpanded = expandedEvent === i;
                  const badgeStyles =
                    p.status === "failed"
                      ? "bg-red-50 text-red-700"
                      : p.status === "delivered"
                        ? "bg-green-50 text-green-700"
                        : p.status === "opened"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-700";
                  const badgeLabel =
                    p.status === "failed" ? "Bounced" : p.status;

                  return (
                    <div key={i} className="py-3">
                      <button
                        onClick={() => setExpandedEvent(isExpanded ? null : i)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            size={18}
                            className={`text-gray-400 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                          <span className="text-sm text-gray-900">
                            {p.email}
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${badgeStyles}`}
                        >
                          {badgeLabel}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3">
                          <EmailEventsTimeline
                            status={p.status}
                            createdAt={notification.createdAt}
                            sentAt={
                              notification.sentAt || notification.createdAt
                            }
                            deliveredAt={
                              p.deliveredAt || notification.deliveredAt
                            }
                            openedAt={p.openedAt || notification.openedAt}
                            failedAt={p.failedAt || notification.failedAt}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        {/* ------------------------------------------ */}

        {/* Message Body Block */}
        {/* Message Body — moved to the end */}
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:px-6">
              <div className="flex items-center justify-between mb-3">
                <dt className="text-sm font-medium text-gray-500">
                  Message Body
                </dt>

                <div className="flex rounded-md border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setBodyView("preview")}
                    className={`px-3 py-1 text-xs font-bold ${
                      bodyView === "preview"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setBodyView("html")}
                    className={`px-3 py-1 text-xs font-bold border-l border-gray-200 ${
                      bodyView === "html"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setBodyView("text")}
                    className={`px-3 py-1 text-xs font-bold border-l border-gray-200 ${
                      bodyView === "text"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Plain Text
                  </button>
                </div>
              </div>

              <dd className="mt-1 text-sm text-gray-900">
                {bodyView === "preview" && (
                  <div
                    className="bg-gray-50 p-4 rounded border border-gray-200 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: notification.renderedBody || "No content.",
                    }}
                  />
                )}

                {bodyView === "html" && (
                  <pre className="bg-gray-50 text-gray-900 p-4 rounded border border-gray-200 text-xs overflow-x-auto whitespace-pre-wrap wrap-break-word">
                    {formatHtml(notification.renderedBody || "") ||
                      "No content."}
                  </pre>
                )}

                {bodyView === "text" && (
                  <pre className="bg-gray-50 p-4 rounded border border-gray-200 text-sm whitespace-pre-wrap wrap-break-word">
                    {htmlToPlainText(notification.renderedBody || "") ||
                      "No content."}
                  </pre>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
