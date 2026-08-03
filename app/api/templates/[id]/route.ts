import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/utils/verifyApiKey";
import { getTemplateByIdService } from "@/services/template.service";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function GET(
  req: NextRequest, // Using the underscore because we don't need the request body
  { params }: { params: Promise<{ id: string }> }, // Acknowledging params is a Promise
) {
  try {
    const apiKey = req.headers.get("x-api-key") as string;
    const department = await verifyApiKey(apiKey);

    // Unwrapping the params for Next.js 15+
    const resolvedParams = await params;
    const templateId = resolvedParams.id;

    // Call the service layer
    const template = await getTemplateByIdService(
      templateId,
      String(department._id),
    );

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
