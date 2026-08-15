import { NextRequest, NextResponse } from "next/server";
import { getTemplateByIdService } from "@/services/template.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import {
  updateTemplateService,
  deleteTemplateService,
} from "@/services/template.service";
import { getSession } from "@/lib/auth/session";
import Department from "@/db/models/Department";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const templateId = resolvedParams.id;

    const template = await getTemplateByIdService(
      templateId,
      session.departmentId,
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

//update a template

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    const department = await Department.findById(session.departmentId);
    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 },
      );
    }

    const resolvedParams = await params;
    const templateId = resolvedParams.id;
    const body = await req.json();

    const updatedTemplate = await updateTemplateService(
      templateId,
      session.departmentId,
      department.allowedChannels,
      body,
    );

    return NextResponse.json(
      { success: true, data: updatedTemplate },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}

//delete a template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const templateId = resolvedParams.id;

    // Call the service
    await deleteTemplateService(templateId, session.departmentId);

    return NextResponse.json(
      {
        success: true,
        message: "Template deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
