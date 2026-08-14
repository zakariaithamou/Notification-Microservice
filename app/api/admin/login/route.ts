// Admin login route
import { NextRequest, NextResponse } from "next/server";
import { handleErrorResponse } from "@/utils/apiResponse";
import { createAdminSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, apiKey } = body;

    const envUsername = process.env.ADMIN_USERNAME;
    const envApiKey = process.env.ADMIN_API_KEY;

    // Check if both match the .env file
    if (
      !username ||
      !apiKey ||
      username !== envUsername ||
      apiKey !== envApiKey
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid Admin Credentials" },
        { status: 401 },
      );
    }
    await createAdminSession();

    return NextResponse.json(
      {
        success: true,
        message: "Admin logged in successfully",
        data: { token: "admin_authorized" },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
