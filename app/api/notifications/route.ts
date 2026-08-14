import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/utils/verifyApiKey";
import {
  createNotificationService,
  getAllNotificationsService,
} from "@/services/notification.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import { getSession } from "@/lib/auth/session";
import Department from "@/db/models/Department";

export async function POST(req: NextRequest) {
  try {
    let departmentId = "";
    let departmentName = "";
    let departmentEmail = "";

    // Check for a Human Session (Cookie) FIRST
    const session = await getSession();

    if (session) {
      // --- HUMAN: Authenticated via Dashboard ---
      const dept = await Department.findById(session.departmentId);
      if (!dept) {
        return NextResponse.json(
          { success: false, error: "Department not found" },
          { status: 404 },
        );
      }
      departmentId = String(dept._id);
      departmentName = dept.name;
      departmentEmail = dept.contactEmail;
    } else {
      // --- Other backends: Authenticated via x-api-key ---
      const apiKey = req.headers.get("x-api-key");

      if (!apiKey) {
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED: Missing session cookie or x-api-key header",
          },
          { status: 401 },
        );
      }

      const department = await verifyApiKey(apiKey);
      departmentId = String(department._id);
      departmentName = department.name;
      departmentEmail = department.contactEmail;
    }

    // Parse the body
    const body = await req.json();

    // Call the service for both
    const newNotification = await createNotificationService({
      ...body,
      departmentId,
      departmentName,
      departmentEmail,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification request queued successfully.",
        data: newNotification,
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
    const notifications = await getAllNotificationsService(
      session.departmentId,
    );

    return NextResponse.json(
      {
        success: true,
        data: notifications,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
