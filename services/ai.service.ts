import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export interface GenerateBodyInput {
  prompt: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  departmentName?: string;
  currentBody?: string;
}

export class AIService {
  static async generateTemplateBody({
    prompt,
    channel,
    departmentName,
    currentBody,
  }: GenerateBodyInput): Promise<string> {
    // Formatting rules per channel
    let formatRule = "";
    if (channel === "email") {
      formatRule =
        'Format using clean HTML tags (e.g., <p>, <strong>, <a href="...">). Do NOT use <html> or <body> tags.';
    } else if (channel === "whatsapp") {
      formatRule =
        "Format as WhatsApp text using *bold*, _italic_, ~strikethrough~, and emojis where appropriate. Do NOT use HTML or markdown backticks.";
    } else {
      formatRule =
        "Format as plain text only. Do NOT use HTML tags or markdown.";
    }

    const deptContext = departmentName
      ? `- Department Name: "${departmentName}". Use literal text "${departmentName}" instead of creating a {{department_name}} variable.`
      : "";

    const systemInstruction = `
      You are an assistant inside a notification microservice.
      Generate a template body for channel: "${channel}".

      DEFAULT METADATA:
      ${deptContext}
      
      RULES FOR VARIABLES:
      1. Use double curly braces {{variable_name}} for user-specific dynamic values (e.g., {{user_name}}, {{order_id}}, {{due_date}}).
      2. Do NOT create variables for static company/department info.

      FORMATTING RULES:
      1. ${formatRule}
      2. Return ONLY the raw output content. Never wrap in markdown code blocks (\`\`\` or \`\`\`html).
      ${channel === "sms" ? "3. Keep total text length strictly under 160 characters." : ""}
      ${currentBody ? `4. You are updating an existing template body. Modify this text: "${currentBody}"` : ""}
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      return response.text?.trim() || "";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI generation error";
      console.error("Gemini Service Error:", message);
      throw new Error("Failed to generate template body.");
    }
  }
}
