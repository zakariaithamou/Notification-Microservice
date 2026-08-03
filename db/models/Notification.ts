import mongoose, { Schema, Model, Document, Types } from "mongoose";

/**
 * Supported delivery channels for a notification.
 */
export type NotificationChannel = "email" | "sms" | "push" | "whatsapp";

//Lifecycle status of a notification.

export type NotificationStatus =
  "pending" | "sending" | "sent" | "failed" | "retrying" | "cancelled";

/**
 * A single recipient target for the notification.
 * Kept flexible: an email, phone number, device token, or user id.
 */
export interface INotificationRecipient {
  address: string;
  userId?: Types.ObjectId;
}

/**
 * TypeScript interface describing a Notification document.
 */

export interface INotification extends Document {
  departmentId: Types.ObjectId;
  templateId: Types.ObjectId;
  channel: NotificationChannel;
  recipients: INotificationRecipient[];
  variables: Record<string, unknown>;
  renderedSubject?: string;
  renderedBody: string;
  status: NotificationStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: Date;
  lastError?: string;
  createdAt: Date;
  sentAt?: Date;
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    address: {
      type: String,
      required: [true, "Recipient address is required"],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { _id: false },
);

const NotificationSchema = new Schema<INotification>(
  {
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "departmentId is required"],
      index: true,
    },

    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: [true, "templateId is required"],
      index: true,
    },

    channel: {
      type: String,
      enum: {
        values: ["email", "sms", "push", "whatsapp"],
        message: "{VALUE} is not a supported notification channel",
      },
      required: [true, "channel is required"],
    },

    recipients: {
      type: [NotificationRecipientSchema],
      required: true,
      validate: {
        validator: (val: INotificationRecipient[]) =>
          Array.isArray(val) && val.length > 0,
        message: "At least one recipient is required",
      },
    },

    variables: {
      type: Schema.Types.Mixed,
      default: {},
    },

    renderedSubject: {
      type: String,
      trim: true,
    },

    renderedBody: {
      type: String,
      required: [true, "renderedBody is required"],
    },

    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "sending",
          "sent",
          "failed",
          "retrying",
          "cancelled",
        ],
        message: "{VALUE} is not a valid notification status",
      },
      default: "pending",
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: [0, "attempts cannot be negative"],
    },

    maxAttempts: {
      type: Number,
      default: 3,
      min: [1, "maxAttempts must be at least 1"],
    },

    nextRetryAt: {
      type: Date,
    },

    lastError: {
      type: String,
    },

    sentAt: {
      type: Date,
    },
  },

  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  },
);

// Custom validation: sentAt should only be set once status is "sent".

NotificationSchema.pre("validate", function (this: INotification) {
  if (this.status === "sent" && !this.sentAt) {
    this.sentAt = new Date();
  }

  if (this.attempts > this.maxAttempts) {
    throw new Error("attempts cannot exceed maxAttempts");
  }
});

// Helpful compound index for retry-queue style queries.
NotificationSchema.index({ status: 1, nextRetryAt: 1 });
NotificationSchema.index({ departmentId: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
