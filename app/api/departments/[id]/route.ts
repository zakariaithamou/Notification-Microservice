import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  getDepartmentByIdService,
  updateDepartmentService,
} from "@/services/department.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import { requireAuth } from "@/lib/auth/requireAuth";
import Department from "@/db/models/Department";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const apiKey = req.headers.get("x-api-key");
    const adminKey = process.env.ADMIN_API_KEY;
    // 2. Await the params before extracting the ID
    const resolvedParams = await params;
    const departmentId = resolvedParams.id;

    // Admin bypass
    if (apiKey === adminKey) {
      // 1. Bypass the BOLA check and go straight to the database
      const department = await Department.findById(departmentId)
        .select("-apiKeyHash -password -otpCode -otpExpiry -trustedDevices")
        .lean();

      if (!department) {
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { success: true, data: department },
        { status: 200 },
      );
    }

    const sessionDeptId = await requireAuth();

    // NEW: If the frontend asks for "me", automatically substitute the secure session ID!
    const targetId = departmentId === "me" ? sessionDeptId : departmentId;

    const department = await getDepartmentByIdService(targetId, sessionDeptId);
    return NextResponse.json(
      {
        success: true,
        data: department,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();

    const apiKey = req.headers.get("x-api-key");
    const adminKey = process.env.ADMIN_API_KEY;

    if (apiKey !== adminKey) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Admin access required" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const departmentId = resolvedParams.id;
    const body = await req.json();

    const department = await updateDepartmentService(departmentId, body);

    return NextResponse.json(
      {
        success: true,
        message: "Department updated successfully.",
        data: department,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
