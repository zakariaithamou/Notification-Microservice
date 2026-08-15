import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Department from "@/db/models/Department";
import { createSession } from "@/lib/auth/session";
import { handleErrorResponse } from "@/utils/apiResponse";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Get the email and the 6-digit code the user typed in
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      throw new Error("VALIDATION_ERROR: Email and OTP code are required");
    }

    // 2. Find the department using contactEmail (and pull the trusted devices)
    const department = await Department.findOne({ contactEmail: email }).select(
      "+trustedDevices +passwordExpiresAt",
    );

    if (!department) {
      throw new Error("NOT_FOUND_ERROR: Department not found");
    }

    // 3. Verify the OTP exists and hasn't expired
    if (!department.otp?.codeHash) {
      throw new Error("UNAUTHORIZED: No verification code requested");
    }

    if (department.otp.expiresAt && department.otp.expiresAt < new Date()) {
      throw new Error(
        "UNAUTHORIZED: Verification code has expired. Please log in again.",
      );
    }

    // 4. Check if the codes match
    if (department.otp.codeHash !== otpCode) {
      // Here you could also increment department.otp.attempts and save if you wanted
      throw new Error("UNAUTHORIZED: Invalid verification code");
    }

    // 5. SUCCESS! The code is correct. Wipe the OTP so it can't be reused.
    department.otp = {
      codeHash: undefined,
      expiresAt: undefined,
      attempts: 0,
    };

    // ---------------------------------------------------------
    //  6. GENERATE TRUSTED DEVICE TOKEN
    // ---------------------------------------------------------
    // Create a 24byte secure random string for the browser
    const rawToken = crypto.randomBytes(24).toString("hex");

    // Hash it before saving to the database
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const deviceExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Clean up any old expired devices, then add the new one
    department.trustedDevices =
      department.trustedDevices?.filter((d) => d.expiresAt > new Date()) || [];
    department.trustedDevices.push({
      tokenHash,
      createdAt: new Date(),
      expiresAt: deviceExpiry,
      userAgent: req.headers.get("user-agent") || "Unknown",
    });

    await department.save();

    // 7. Issue the standard session cookie
    await createSession(department._id.toString());

    // Check if this is a first-time login (temporary password)
    const isFirstTimeLogin = !!department.passwordExpiresAt;
    // 8. Return success
    const response = NextResponse.json(
      {
        success: true,
        status: isFirstTimeLogin ? "REQUIRE_NEW_PASSWORD" : "LOGGED_IN",
        message: "OTP verified successfully",
      },
      { status: 200 },
    );

    response.cookies.set("trusted_device", rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: deviceExpiry,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
