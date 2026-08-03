import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getDepartmentByIdService } from "@/services/department.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import { verifyApiKey } from "@/utils/verifyApiKey";
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

    //admin
    if (apiKey === adminKey) {
      // 1. Bypass the BOLA check and go straight to the database
      const department = await Department.findById(departmentId)
        .select("-apiKeyHash")
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

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: API key missing" },
        { status: 401 },
      );
    }

    const authenticatedDept = await verifyApiKey(apiKey);

    // Call the service, passing the dynamic 'id' from the URL
    const department = await getDepartmentByIdService(
      departmentId,
      String(authenticatedDept._id),
    );

    return NextResponse.json(
      {
        success: true,
        data: department,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    // Rely on your centralized error handler
    return handleErrorResponse(error);
  }
}
