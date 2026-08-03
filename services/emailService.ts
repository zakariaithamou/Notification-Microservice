import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "CRITICAL :RESEND_API_KEY is missing in the environment variables.",
  );
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
}
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string | unknown;
}

//// 2. Initialize the email provider
class EmailService {
  public provider: Resend;
  private defaultFrom = "Notification Service <onboarding@resend.dev>";

  constructor() {
    this.provider = new Resend(apiKey);
    console.log("EamailService: Resend Provider initialized successfully. ");
  }

  public async sendEmail(Payload: SendEmailPayload): Promise<SendEmailResult> {
    console.log("EamilService : Attempting to send email to ${Payload.to}...");

    try {
      const { data, error } = await this.provider.emails.send({
        from: this.defaultFrom,
        to: typeof Payload.to === "string" ? [Payload.to] : Payload.to,
        subject: Payload.subject,
        html: Payload.html,
      });

      if (error) {
        console.error(
          `EmailService: Provider error when sending to ${Payload.to}`,
          error,
        );
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(
        `EmailService: Successfully sent to ${Payload.to}. Message ID: ${data?.id}`,
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
}

export const emailService = new EmailService();
