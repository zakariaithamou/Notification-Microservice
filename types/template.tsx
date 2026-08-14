export type TemplateChannel = "email" | "sms" | "push" | "whatsapp";

export interface Template {
  _id: string;
  name: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  departmentId: string;
  templateType?: "single" | "diffusion";
  createdAt: string;
}

export interface CreateTemplateInput {
  name: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  templateType?: "single" | "diffusion";
}

// API Response Wrappers based on NextResponse structure
export interface TemplatesListResponse {
  success: boolean;
  data: Template[];
}

export interface SingleTemplateResponse {
  success: boolean;
  message?: string;
  data: Template;
}
