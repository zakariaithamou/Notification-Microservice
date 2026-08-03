export type TemplateChannel = "email" | "sms" | "push" | "whatsapp";

export interface Template {
  _id: string;
  name: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  departmentId: string;
  createdAt: string; // MongoDB Dates arrive as strings via JSON
}

export interface CreateTemplateInput {
  name: string;
  channel: TemplateChannel;
  subject?: string;
  body: string;
  templateType?: "single" | "diffusion";
}

// API Response Wrappers based on your NextResponse structure
export interface TemplatesListResponse {
  success: boolean;
  data: Template[];
}

export interface SingleTemplateResponse {
  success: boolean;
  message?: string;
  data: Template;
}
