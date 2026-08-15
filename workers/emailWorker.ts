import amqp from "amqplib";

import Notification from "@/db/models/Notification";
import { processAndSendEmail } from "@/services/notification.service";
import dbConnect from "@/lib/dbConnect";
import student from "@/db/models/Student";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const QUEUE_NAME = "email_queue";

// Dynamically replaces ANY variable inside {{ }} with the matching DB data
function injectVariables(
  template: string,
  recipientData: Record<string, unknown>,
) {
  if (!template) return "";

  return template.replace(/\{\{\s*(.*?)\s*\}\}/g, (match, key) => {
    const normalizedKey = key.replace(/\s+/g, "").toLowerCase();

    const normalizedUserData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(recipientData)) {
      normalizedUserData[k.replace(/\s+/g, "").toLowerCase()] = v;
    }

    return normalizedUserData[normalizedKey] !== undefined
      ? String(normalizedUserData[normalizedKey])
      : match;
  });
}

async function startWorker() {
  await dbConnect();
  console.log(" Worker connected to MongoDB");

  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });

  //  ensures the worker only processes 1 email at a time
  channel.prefetch(1);
  console.log(` Worker listening for messages in ${QUEUE_NAME}...`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const content = JSON.parse(msg.content.toString());
    const notificationId = content.notificationId;
    const customFrom = content.from;

    console.log(`\nProcessing notification from queue: ${notificationId}`);
    try {
      const notification = await Notification.findById(notificationId);

      // 1. Check if it exists and is pending
      if (!notification || notification.status !== "pending") {
        console.log(
          `Notification ${notificationId} not found or not pending. Skipping.`,
        );
        channel.ack(msg);
        return;
      }

      // 2. Update status to sending
      await Notification.findByIdAndUpdate(notificationId, {
        $set: { status: "sending" },
        $inc: { attempts: 1 },
      });

      // --- 3.Fetch all student details in ONE database call ---
      const emailAddresses = notification.recipients.map(
        (r: { address: string }) => r.address,
      );

      // Query your database for all students matching these emails
      const students = await student.find({ email: { $in: emailAddresses } });

      // Create a fast-lookup dictionary: { "ahmed@email.com": { firstname: "Ahmed", ... } }
      const studentMap: Record<string, Record<string, unknown>> = {};
      students.forEach((studentDoc) => {
        studentMap[studentDoc.email] = studentDoc.toObject();
      });

      // 1. Build the array of individual email objects
      const batchPayloads = (
        notification.recipients as {
          address: string & Record<string, unknown>;
        }[]
      ).map((recipient) => {
        console.log("Recipient data from DB:", recipient);

        // Grab the full student data from dictionary using their email address
        const fullStudentData = studentMap[recipient.address] || {};

        // Combine the address with the full database data
        const mergedRecipientData = { ...recipient, ...fullStudentData };

        // Pass data into  Regex parser
        const personalizedSubject = injectVariables(
          notification.renderedSubject || "No Subject",
          mergedRecipientData,
        );
        const personalizedHtml = injectVariables(
          notification.renderedBody,
          mergedRecipientData,
        );

        return {
          to: [recipient.address], // Only this student's email
          subject: personalizedSubject,
          html: personalizedHtml,
          from: customFrom,
        };
      });

      // 2. Send the entire batch array in one single API call
      const result = await processAndSendEmail(notification._id, batchPayloads);

      // 3. Update the notification status in the database
      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date();
        notification.providerId = result.providerIds;
      } else {
        notification.status = "failed";
        notification.lastError = result.error
          ? typeof result.error === "string"
            ? result.error
            : JSON.stringify(result.error)
          : "Batch failed to send";
      }

      await notification.save();

      console.log(` Finished processing ${notificationId}`);
      channel.ack(msg);
    } catch (error) {
      console.error(` Error processing ${notificationId}:`, error);
      // Put it back in the queue to try again
      channel.nack(msg, false, true);
    }
  });
}

startWorker().catch((error) => {
  console.error(" Failed to start email worker:", error);
  process.exit(1);
});
