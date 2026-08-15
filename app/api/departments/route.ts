import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  createDepartmentService,
  getAllDepartmentsService,
} from "@/services/department.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await dbConnect();

    // Call the service layer
    const departments = await getAllDepartmentsService();

    return NextResponse.json(
      {
        success: true,
        data: departments,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Just call the apiResponse for errors!
    return handleErrorResponse(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Auto-generate a secure 12-character random password
    const plainTextPassword = crypto.randomBytes(6).toString("hex");

    //  Set expiration to 24 hours from now
    const passwordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const servicePayload = {
      ...body,
      plainTextPassword,
      passwordExpiresAt,
    };

    const result = await createDepartmentService(servicePayload);

    return NextResponse.json(
      {
        success: true,
        message: "Department registered successfully.",
        data: {
          id: result.newDepartment._id,
          name: result.newDepartment.name,
          apiKey: result.rawKey,
          temporaryPassword: plainTextPassword,
          contactEmail: result.newDepartment.contactEmail,
          allowedChannels: result.newDepartment.allowedChannels,
          programType: result.newDepartment.programType,
          filieres: result.newDepartment.filieres,
          active: result.newDepartment.active,
          createdAt: result.newDepartment.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
