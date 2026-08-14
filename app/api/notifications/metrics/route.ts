import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getMetricsService } from "@/services/notification.service";
import { handleErrorResponse } from "@/utils/apiResponse";
import Department from "@/db/models/Department";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    //Authenticate via Session Cookie
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: No session found" },
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

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get("days")) || 15;
    const requestedChannel = searchParams.get("channel") || "all";

    const allowedChannels =
      department.allowedChannels && Array.isArray(department.allowedChannels)
        ? ["all", ...department.allowedChannels]
        : ["all", "email", "sms", "push", "whatsapp"];

    type AllowedChannel = "all" | "email" | "sms" | "push" | "whatsapp";

    const resolvedChannel = allowedChannels.includes(requestedChannel)
      ? requestedChannel
      : "all";

    const channel: AllowedChannel = resolvedChannel as AllowedChannel;

    // 4. Fetch metrics using the session's departmentId and validated channel
    const metricsData = await getMetricsService(session.departmentId, {
      days,
      channel,
    });

    return NextResponse.json(
      {
        success: true,
        data: metricsData,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
