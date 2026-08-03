import { NextRequest, NextResponse } from "next/server";
import {
  createTemplateService,
  getAllTemplatesService,
} from "@/services/template.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import { verifyApiKey } from "@/utils/verifyApiKey";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key") as string;
    const department = await verifyApiKey(apiKey);

    const body = await req.json();

    const newTemplate = await createTemplateService(
      body,
      String(department._id),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Template created successfully.",
        data: newTemplate,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key") as string;
    const department = await verifyApiKey(apiKey);

    // Extract optional query parameters (e.g., /api/templates?departmentId=123)

    // Call the service layer
    const templates = await getAllTemplatesService(String(department._id));

    return NextResponse.json(
      {
        success: true,
        data: templates,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
