import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import {
  createDepartmentService,
  getAllDepartmentsService,
} from "@/services/department.service";
import { handleErrorResponse } from "@/utils/apiResponse";

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

    // Pass the data to the service layer
    const result = await createDepartmentService(body);

    return NextResponse.json(
      {
        success: true,
        message: "Department registered successfully.",
        data: {
          id: result.newDepartment._id,
          name: result.newDepartment.name,
          apiKey: result.rawKey, // Show the raw key ONCE to the client
          contactEmail: result.newDepartment.contactEmail,
          allowedChannels: result.newDepartment.allowedChannels,
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
