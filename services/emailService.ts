import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "CRITICAL :RESEND_API_KEY is missing in the environment variables.",
  );
}

export interface SendBatchResult {
  success: boolean;
  data?: unknown;
  error?: string | unknown;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string | unknown;
}

class EmailService {
  public provider: Resend;
  private defaultFrom = "Universiapolis Notifications <noreply@zakarianms.ma>";

  constructor() {
    this.provider = new Resend(apiKey);
    console.log("EamailService: Resend Provider initialized successfully. ");
  }

  public async sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
    console.log(`EmailService: Attempting to send email to ${payload.to}...`);

    try {
      const { data, error } = await this.provider.emails.send({
        from: payload.from || this.defaultFrom,
        to: typeof payload.to === "string" ? [payload.to] : payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (error) {
        console.error(
          `EmailService: Provider error when sending to ${payload.to}`,
          error,
        );
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(
        `EmailService: Successfully sent to ${payload.to}. Message ID: ${data?.id}`,
      );
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (exception) {
      console.error(
        `EmailService: Critical exception during email send:`,
        exception,
      );

      return {
        success: false,
        error:
          exception instanceof Error
            ? exception.message
            : "Unknown internal error",
      };
    }
  }

  public async sendBatchEmails(
    payloads: SendEmailPayload[],
  ): Promise<SendBatchResult> {
    console.log(
      `EmailService: Attempting to send batch of ${payloads.length} emails...`,
    );

    try {
      const formattedPayloads = payloads.map((payload) => ({
        from: payload.from || this.defaultFrom,
        to: typeof payload.to === "string" ? [payload.to] : payload.to,
        subject: payload.subject,
        html: payload.html,
      }));

      const { data, error } = await this.provider.batch.send(formattedPayloads);

      if (error) {
        console.error(`EmailService: Provider error when sending batch`, error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(
        `EmailService: Successfully sent batch of ${payloads.length} emails.`,
      );
      return {
        success: true,
        data,
      };
    } catch (exception) {
      console.error(
        `EmailService: Critical exception during batch send:`,
        exception,
      );

      return {
        success: false,
        error:
          exception instanceof Error
            ? exception.message
            : "Unknown internal error",
      };
    }
  }
}

export const emailService = new EmailService();
