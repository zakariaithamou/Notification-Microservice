import mongoose from "mongoose";
import Notification from "@/db/models/Notification";
import Department from "@/db/models/Department";
import Template from "@/db/models/Template";
import { emailService, SendEmailPayload } from "./emailService";
import { publishToQueue } from "@/lib/queues/rabbitmq";

// Notification payload
export interface CreateNotificationInput {
  departmentId: string;
  templateId: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  recipients: Record<string, unknown>[];
  variables?: Record<string, unknown>;
  renderedSubject?: string;
  renderedBody: string;
  departmentName?: string; // NEW
  departmentEmail?: string;
}

export const createNotificationService = async (
  data: CreateNotificationInput,
) => {
  const {
    departmentId,
    templateId,
    channel,
    recipients,
    variables,
    renderedSubject,
    renderedBody,
  } = data;

  // Validate IDs
  if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: A valid department ID is required.");
  }
  if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
    throw new Error("VALIDATION_ERROR: A valid template ID is required.");
  }

  // Validate enums and arrays
  const validChannels = ["email", "sms", "push", "whatsapp"];
  if (!channel || !validChannels.includes(channel)) {
    throw new Error(
      "VALIDATION_ERROR: Invalid channel. Must be email, sms, push, or whatsapp.",
    );
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("VALIDATION_ERROR: At least one recipient is required.");
  }

  // Validate body
  if (
    !renderedBody ||
    typeof renderedBody !== "string" ||
    renderedBody.trim() === ""
  ) {
    throw new Error("VALIDATION_ERROR: Rendered body is required.");
  }

  // Verify referenced documents
  const existingDept = await Department.findById(departmentId);
  if (!existingDept) {
    throw new Error(
      "NOT_FOUND_ERROR: The specified department does not exist.",
    );
  }

  const existingTemplate = await Template.findById(templateId);
  if (!existingTemplate) {
    throw new Error("NOT_FOUND_ERROR: The specified template does not exist.");
  }

  // Create the notification
  const newNotification = await Notification.create({
    departmentId,
    templateId,
    channel,
    recipients,
    variables: variables || {},
    renderedSubject: renderedSubject ? renderedSubject.trim() : undefined,
    renderedBody: renderedBody.trim(),
    status: "pending",
    attempts: 0,
    maxAttempts: 3,
  });
  const customSender = `${existingDept.name} <${existingDept.contactEmail}>`;

  // NEW: Push the ID AND the custom sender to RabbitMQ immediately after saving to MongoDB
  try {
    await publishToQueue({
      notificationId: newNotification._id.toString(),
      from: customSender, // <-- We hand this off to the worker!
    });

    console.log(`📥 Published notification ${newNotification._id} to queue`);
  } catch (error) {
    console.error("Failed to publish to queue, but saved to DB:", error);
    // Even if RabbitMQ fails, it's in the DB as 'pending' so it's not lost forever
  }

  return newNotification;
};

export const getAllNotificationsService = async (departmentId: string) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: Invalid department ID format.");
  }

  const notifications = await Notification.find({ departmentId }).sort({
    createdAt: -1,
  });

  if (notifications.length === 0) {
    throw new Error(
      "NOT_FOUND_ERROR: There are no notifications at this department yet.",
    );
  }
  return notifications;
};

export const getNotificationByIdService = async (
  id: string,
  departmentId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("VALIDATION_ERROR: Invalid notification ID format.");
  }

  const notification = await Notification.findOne({
    _id: id,
    departmentId: departmentId,
  });

  if (!notification) {
    throw new Error(
      "NOT_FOUND_ERROR: Notification not found or you are unauthorized to view it.",
    );
  }

  return notification;
};

export async function processAndSendEmail(
  notificationId: string | mongoose.Types.ObjectId,
  payload: SendEmailPayload[],
) {
  console.log(
    `Sending batch of ${payload.length} emails for Notification ID: ${notificationId}`,
  );
  // Dispatch the email via the email provider (Resend)

  const emailResult = await emailService.sendBatchEmails(payload);
  console.log("RESEND RAW RESPONSE:", JSON.stringify(emailResult, null, 2));
  // Success: return the result so the caller emailWorker can track it
  if (emailResult.success && emailResult.data) {
    let providerObjects: { id: string; email: string; status: string }[] = [];
    const responseData = emailResult.data as { data?: unknown[] } | unknown[];

    const rawData = Array.isArray(responseData)
      ? responseData
      : responseData?.data;

    if (Array.isArray(rawData)) {
      providerObjects = rawData

        .map((item: unknown, index: number) => {
          const resendItem = item as Record<string, unknown>;
          const itemId =
            typeof resendItem?.id === "string" ? resendItem.id : "";

          const toField = payload[index]?.to;
          const emailAddress = Array.isArray(toField) ? toField[0] : toField;

          return {
            id: itemId,
            email: typeof emailAddress === "string" ? emailAddress : "",
            status: "sent",
          };
        })

        .filter((obj) => obj.id !== "");
    }

    return { success: true, providerIds: providerObjects };
  }

  return { success: false, error: emailResult.error };
}

interface MetricsOptions {
  days?: number;
  channel?: "all" | "email" | "sms" | "push" | "whatsapp";
}

const STATUS_LIST = [
  "pending",
  "sending",
  "sent",
  "delivered",
  "opened",
  "failed",
  "retrying",
  "cancelled",
] as const;

type StatusCounts = Record<(typeof STATUS_LIST)[number], number>;
type DayBucket = { date: string } & StatusCounts;

const formatDayKey = (d: Date) => d.toISOString().split("T")[0]; // YYYY-MM-DD
const formatDayLabel = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }); // "Aug 01"

const createEmptyStatusCounts = (): StatusCounts =>
  STATUS_LIST.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as StatusCounts);

export const getMetricsService = async (
  departmentId: string,
  options: MetricsOptions = {},
) => {
  if (!mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: Invalid department ID format.");
  }

  const days = options.days ?? 15;
  const channel = options.channel ?? "all";

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const filter: Record<string, unknown> = {
    departmentId,
    createdAt: { $gte: startDate },
  };
  if (channel !== "all") {
    filter.channel = channel;
  }

  const notifications = await Notification.find(filter).lean();

  // Initialize a bucket per day in the range, zeroed for every status.
  const buckets = new Map<string, DayBucket>();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = formatDayKey(d);
    buckets.set(key, {
      date: formatDayLabel(d),
      ...createEmptyStatusCounts(),
    });
  }

  const bumpBucket = (
    date: Date | undefined,
    status: (typeof STATUS_LIST)[number],
  ) => {
    if (!date) return;
    const key = formatDayKey(date);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket[status] = bucket[status] + 1;
    }
  };
  let totalSent = 0;
  let totalDelivered = 0;

  for (const n of notifications) {
    // Event-based lines
    const sentDate = n.sentAt ? new Date(n.sentAt) : undefined;

    if (sentDate) {
      bumpBucket(sentDate, "sent");
      totalSent += 1;
    }
    const providerRecords = Array.isArray(n.providerId) ? n.providerId : [];

    const deliveredEntry = providerRecords.find((p) => p.deliveredAt);
    if (deliveredEntry?.deliveredAt) {
      bumpBucket(new Date(deliveredEntry.deliveredAt), "delivered");
      totalDelivered += 1;
    } else if (n.status === "delivered" && sentDate) {
      bumpBucket(sentDate, "delivered");
      totalDelivered += 1;
    }

    const openedEntry = providerRecords.find((p) => p.openedAt);
    if (openedEntry?.openedAt) {
      bumpBucket(new Date(openedEntry.openedAt), "opened");
    }

    const failedEntry = providerRecords.find((p) => p.failedAt);
    if (failedEntry?.failedAt) {
      bumpBucket(new Date(failedEntry.failedAt), "failed");
    } else if (n.status === "failed") {
      bumpBucket(new Date(n.updatedAt ?? n.createdAt), "failed");
    }

    // Snapshot-based lines: no history, just "currently in this state".
    if (["pending", "sending", "retrying", "cancelled"].includes(n.status)) {
      bumpBucket(
        new Date(n.createdAt),
        n.status as (typeof STATUS_LIST)[number],
      );
    }
  }

  const timeline = Array.from(buckets.values());

  return {
    summary: {
      total: notifications.length,
      totalSent,
      deliverabilityRate:
        totalSent > 0
          ? Number(((totalDelivered / totalSent) * 100).toFixed(2))
          : 0,
    },
    timeline,
  };
};

/**
 * [FALLBACK---UNUSED] processNotificationQueue
 * ------------------------------------------------
 * Purpose: DB "sweeper" that scans MongoDB for any Notification documents
 * stuck with status: "pending" and attempts to send them via processAndSendEmail().
 *
 * Why:
 * 1.This was designed as a safety net for cases where a notification got saved
 * to the DB but never made it into RabbitMQ (e.g. publishToQueue() failed
 * because RabbitMQ was down/unreachable at the time).
 *
 *
 * 2.The app relies fully on RabbitMQ + emailWorker.ts for real-time processing.
 * emailWorker.ts consumes messages the instant they're published — there is
 * no polling or cron job calling this function, so it currently does nothing.
 *
 * When to re-enable:
 * If you add a cron job / scheduled task (e.g. via node-cron, a serverless
 * scheduled function, or a setInterval) to periodically catch notifications
 * that failed to reach the queue, uncomment this and wire it up to that trigger.
 * 2.  ihave Created an API route, /api/worker, that calls processNotificationQueue()
 *      and returns the result. Example:
 *
 *   3. To "wake up" the worker and send pending emails, visit/hit:
 *      http://localhost:3000/api/worker
 *      (adjust port/domain to match your setup)
 *
 */
export async function processNotificationQueue() {
  console.log("Worker: Scanning for pending notifications...");

  // 1. Find up to 20 pending notifications (batching prevents memory overload)
  const pendingNotifications = await Notification.find({
    status: "pending",
  }).limit(100);

  if (pendingNotifications.length === 0) {
    console.log("Worker: No pending notifications found.");
    return { processed: 0 };
  }

  console.log(
    `Worker: Found ${pendingNotifications.length} jobs. Processing...`,
  );

  let successCount = 0;
  let failCount = 0;
  // 2. Loop through each pending job
  for (const notification of pendingNotifications) {
    try {
      // Cast the populated department to avoid 'any' type
      const dept = notification.departmentId as unknown as {
        name: string;
        contactEmail: string;
      };

      // Safely build customFrom with a fallback if dept is missing
      const customFrom =
        dept && dept.name && dept.contactEmail
          ? `${dept.name} <${dept.contactEmail}>`
          : undefined;

      for (const recipient of notification.recipients) {
        const emailPayload: SendEmailPayload = {
          from: customFrom,
          to: [recipient.address],
          subject: notification.renderedSubject || "No Subject",
          html: notification.renderedBody,
        };

        const result = await processAndSendEmail(
          notification._id,
          emailPayload,
        );

        if (result.success) successCount++;
      }

      const recipientSuccessCount = 0;
      const totalRecipients = notification.recipients.length;

      // Decide ONE status for the whole notification based on recipient outcomes
      if (recipientSuccessCount === totalRecipients) {
        // All recipients got the email
        notification.status = "sent";
        successCount++;
      } else if (recipientSuccessCount > 0) {
        // Some got it, some didn't — still counted as sent (partial delivery is ok)
        notification.status = "sent";
        successCount++;
      } else {
        // Nobody got it
        notification.status = "failed";
        failCount++;
      }

      await notification.save();
    } catch (error) {
      console.error(
        `Worker: Failed to process notification ${notification._id}`,
        error,
      );
      notification.status = "failed";
      await notification.save();
      failCount++;
    }
  }

  return {
    processed: pendingNotifications.length,
    successes: successCount,
    failures: failCount,
  };
}
