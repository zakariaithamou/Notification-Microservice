import mongoose from "mongoose";
import Notification from "@/db/models/Notification"; // Update path to "@/db/models/..." if needed
import Department from "@/db/models/Department";
import Template from "@/db/models/Template";
import { emailService, SendEmailPayload } from "./emailService";

// 1. Strict input interface tailored to what the client should send
export interface CreateNotificationInput {
  departmentId: string;
  templateId: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  recipients: Record<string, unknown>[]; // Matches your INotificationRecipient structure
  variables?: Record<string, unknown>;
  renderedSubject?: string;
  renderedBody: string;
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

  // 1. Validate IDs
  if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
    throw new Error("VALIDATION_ERROR: A valid department ID is required.");
  }
  if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) {
    throw new Error("VALIDATION_ERROR: A valid template ID is required.");
  }

  // 2. Validate Enums & Arrays
  const validChannels = ["email", "sms", "push", "whatsapp"];
  if (!channel || !validChannels.includes(channel)) {
    throw new Error(
      "VALIDATION_ERROR: Invalid channel. Must be email, sms, push, or whatsapp.",
    );
  }

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("VALIDATION_ERROR: At least one recipient is required.");
  }

  // 3. Validate Body
  if (
    !renderedBody ||
    typeof renderedBody !== "string" ||
    renderedBody.trim() === ""
  ) {
    throw new Error("VALIDATION_ERROR: Rendered body is required.");
  }

  // 4. Verify Department and Template actually exist in the database
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

  // 5. Create the Notification
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
  payload: SendEmailPayload,
) {
  // 1. Mark as 'sending' and increment the attempts counter BEFORE dispatching
  await Notification.findByIdAndUpdate(notificationId, {
    $set: { status: "sending" },
    $inc: { attempts: 1 }, // Increments the attempt count by 1
  });

  // 2. Dispatch the email
  const emailResult = await emailService.sendEmail(payload);

  // 3. Handle a successful delivery
  if (emailResult.success) {
    console.log(`Updating DB: Notification ${notificationId} marked as sent.`);

    await Notification.findByIdAndUpdate(notificationId, {
      $set: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    return { success: true, messageId: emailResult.messageId };
  }

  // 4. Handle a failed delivery
  console.log(`Updating DB: Notification ${notificationId} marked as failed.`);

  await Notification.findByIdAndUpdate(notificationId, {
    $set: {
      status: "failed",
      lastError: String(emailResult.error), // Matches your schema's lastError field
    },
  });

  return { success: false, error: emailResult.error };
}

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
      // Extract the email addresses from your recipient objects
      const emailAddresses = notification.recipients.map((r) => r.address);

      // Build the payload directly from the database document
      const payload = {
        to: emailAddresses,
        subject: notification.renderedSubject || "No Subject",
        html: notification.renderedBody,
      };

      // 3. Call your existing processor
      const result = await processAndSendEmail(notification._id, payload);

      if (result.success) successCount++;
      else failCount++;
    } catch (error) {
      console.error(
        `Worker: Failed to process notification ${notification._id}`,
        error,
      );
      failCount++;
    }
  }

  return {
    processed: pendingNotifications.length,
    successes: successCount,
    failures: failCount,
  };
}
