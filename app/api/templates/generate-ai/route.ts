import { NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { prompt, channel, departmentName, currentBody } = body;

    // 2. Validation
    if (!prompt || !channel) {
      return NextResponse.json(
        { error: 'Parameters "prompt" and "channel" are required.' },
        { status: 400 },
      );
    }

    // 3. Call Service
    const generatedBody = await AIService.generateTemplateBody({
      prompt,
      channel,
      departmentName: departmentName || "Our Department",
      currentBody,
    });

    return NextResponse.json({
      success: true,
      body: generatedBody,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /api/templates/generate-ai:", errorMessage);

    return NextResponse.json(
      { error: "Failed to generate template body. Please try again." },
      { status: 500 },
    );
  }
}
