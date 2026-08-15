import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Notification from "@/db/models/Notification";
import { getBounceInfo } from "@/lib/faildMessages";

// Force dynamic so this route is never cached
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. Parse the incoming JSON payload from Resend
    const payload = await req.json();

    // Resend wraps the event inside 'type' and the details inside 'data'
    const { type, data } = payload;
    const providerId = data.email_id;
    console.log(`[Webhook Received] Event: ${type} | ID: ${providerId}`);

    if (!providerId) {
      console.warn("Webhook received without an email_id. Payload:", payload);
      return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
    }

    // 2. Map Resend's event string to your NotificationStatus enum
    let newStatus = "";
    switch (type) {
      case "email.delivered":
        newStatus = "delivered";
        break;
      case "email.bounced":
        newStatus = "failed";
        break;
      case "email.opened":
        newStatus = "opened";
        break;
      case "email.complained":
        newStatus = "failed";
        break;
      default:
        return NextResponse.json(
          { message: "Event ignored but received" },
          { status: 200 },
        );
    }

    // 3. Update the database
    await dbConnect();

    // Create an object to hold our updates
    const now = new Date();

    const updateFields: Record<string, unknown> = {
      "providerId.$.status": newStatus,
    };

    if (newStatus === "delivered") {
      updateFields["providerId.$.deliveredAt"] = now;
    } else if (newStatus === "opened") {
      updateFields["providerId.$.openedAt"] = now;
    } else if (newStatus === "failed") {
      updateFields["providerId.$.failedAt"] = now;

      // console.log("BOUNCE TYPE:", data.bounce?.type);
      //console.log("BOUNCE SUBTYPE:", data.bounce?.subType);
      //console.log("BOUNCE MESSAGE:", data.bounce?.message);

      const bounceInfo = getBounceInfo(data.bounce?.type, data.bounce?.subType);
      console.log("BOUNCE INFO ACTIONS:", bounceInfo.actions);
      updateFields["providerId.$.failedDetails"] = {
        type: data.bounce?.type ?? "Unknown",
        subType: data.bounce?.subType ?? "Unknown",
        message: bounceInfo.message,
        suggestedActions: bounceInfo.actions,
      };
      console.log("UPDATE FIELDS:", JSON.stringify(updateFields));
    }

    const updatedNotification = await Notification.findOneAndUpdate(
      { "providerId.id": providerId }, // Find the document holding this specific ID
      { $set: updateFields }, // Update ONLY that specific object in the array
      { new: true },
    );

    if (!updatedNotification) {
      console.warn(
        `Webhook: No notification found for providerId: ${providerId}`,
      );
      // Still return 200 so Resend knows we received the hook and doesn't retry
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 200 },
      );
    }

    console.log(
      `Webhook Success: Updated ${providerId} to status: ${newStatus}`,
    );

    type NotificationStatusValue = "sent" | "delivered" | "opened" | "failed";

    // Priority is only used as a tie-breaker when two statuses have equal counts
    const STATUS_PRIORITY: Record<NotificationStatusValue, number> = {
      failed: 0,
      sent: 1,
      delivered: 2,
      opened: 3,
    };

    const evaluateParentStatus = (
      recipients: { status: string }[] | undefined,
      currentStatus: string,
    ): string => {
      if (!recipients || recipients.length === 0) return currentStatus;

      // Recompute counts fresh from the array every time (source of truth)
      const counts: Record<NotificationStatusValue, number> = {
        sent: 0,
        delivered: 0,
        opened: 0,
        failed: 0,
      };

      for (const r of recipients) {
        if (r.status in counts) {
          counts[r.status as NotificationStatusValue] += 1;
        }
      }

      const statuses = Object.keys(counts) as NotificationStatusValue[];

      return statuses.reduce((winner, status) => {
        if (counts[status] > counts[winner]) return status;
        if (
          counts[status] === counts[winner] &&
          STATUS_PRIORITY[status] > STATUS_PRIORITY[winner]
        ) {
          return status;
        }
        return winner;
      });
    };

    const newParentStatus = evaluateParentStatus(
      updatedNotification.providerId,
      updatedNotification.status,
    );

    // Update status atomically (avoids overwriting concurrent webhook updates)
    if (updatedNotification.status !== newParentStatus) {
      await Notification.findByIdAndUpdate(updatedNotification._id, {
        $set: { status: newParentStatus },
      });
    }

    // 4. Always return a 200 OK so Resend considers the webhook delivered
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return a 500 error if our server actually crashed
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
