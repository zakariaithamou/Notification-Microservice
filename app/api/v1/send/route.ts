import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { handleErrorResponse } from "@/utils/apiResponse";
import { verifyApiKey } from "@/utils/verifyApiKey";
import { processB2BDispatch } from "@/services/b2b.service"; // <-- Import the new service

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. EXTRACT CREDENTIALS
    const apiKey = req.headers.get("x-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: API key missing" },
        { status: 401 },
      );
    }

    // 2. VERIFY DEPARTMENT
    const authenticatedDept = await verifyApiKey(apiKey);

    if (!authenticatedDept) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Invalid API key" },
        { status: 401 },
      );
    }

    if (!authenticatedDept.active) {
      return NextResponse.json(
        {
          success: false,
          error: "FORBIDDEN: Department account is deactivated",
        },
        { status: 403 },
      );
    }

    // 3. PARSE PAYLOAD
    const payload = await req.json();

    // 4. DELEGATE TO SERVICE
    const result = await processB2BDispatch(payload, authenticatedDept);

    // 5. HANDLE SERVICE ERRORS
    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status || 400 },
      );
    }

    // 6. RETURN SUCCESS
    return NextResponse.json(
      {
        success: true,
        message: "Notifications queued successfully",
        recipientCount: result.data.length,
        preview: result.data[0],
      },
      { status: 202 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
