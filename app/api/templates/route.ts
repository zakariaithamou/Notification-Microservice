import { NextRequest, NextResponse } from "next/server";
import {
  createTemplateService,
  getAllTemplatesService,
} from "@/services/template.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import { verifyApiKey } from "@/utils/verifyApiKey";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: No session found" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const newTemplate = await createTemplateService(
      body,

      session.departmentId,
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
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: No session found" },
        { status: 401 },
      );
    }
    // Call the service layer
    const templates = await getAllTemplatesService(session.departmentId);

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
