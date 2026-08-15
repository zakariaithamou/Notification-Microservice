import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Department from "@/db/models/Department";
import { verifyPassword } from "@/utils/password";
import { sendOtpEmail } from "@/lib/auth/sendOtpEmail";
import { handleErrorResponse } from "@/utils/apiResponse";
import { createSession } from "@/lib/auth/session";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Extract credentials from the request body
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new Error("VALIDATION_ERROR: Email and password are required");
    }

    // 2. Find the department
    // 2. Find the department (pulling the hidden password AND trusted devices)
    const department = await Department.findOne({ contactEmail: email }).select(
      "+passwordHash +trustedDevices",
    );

    // Use the exact same error message for both wrong email and wrong password
    // so attackers cannot guess which emails exist in your system.
    if (!department) {
      throw new Error("UNAUTHORIZED: Invalid credentials");
    }
    console.log("1. Email requested:", email);
    console.log("2. Password typed:", `"${password}"`); // Quotes will reveal hidden spaces!
    console.log("3. Hash from DB:", department.passwordHash);

    // 3. Compare the entered password with the hashed password in the DB
    const isMatch = await verifyPassword(password, department.passwordHash);
    if (!isMatch) {
      throw new Error("UNAUTHORIZED: Invalid credentials");
    }

    // ---------------------------------------------------------
    //  CHECK FOR TRUSTED DEVICE
    // ---------------------------------------------------------
    const trustedCookie = req.cookies.get("trusted_device")?.value;

    if (
      trustedCookie &&
      department.trustedDevices &&
      department.trustedDevices.length > 0
    ) {
      // Hash the cookie from the browser to compare it safely to the DB
      const tokenHash = crypto
        .createHash("sha256")
        .update(trustedCookie)
        .digest("hex");

      // Look for a matching, unexpired device in the array
      const isValidDevice = department.trustedDevices.some(
        (device) =>
          device.tokenHash === tokenHash && device.expiresAt > new Date(),
      );

      if (isValidDevice) {
        // SUCCESS! Device recognized. Skip OTP and log them in instantly.
        await createSession(department._id.toString());

        return NextResponse.json(
          {
            success: true,
            status: "LOGGED_IN", // Frontend will check for this status
            message: "Welcome back, device recognized",
          },
          { status: 200 },
        );
      }
    }

    // 4. Generate a random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Set expiration to 10 minutes from exactly right now
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 6. Save the code and expiry directly to the department document

    department.otp = {
      codeHash: otpCode,
      expiresAt: otpExpiry,
      attempts: 0,
    };
    await department.save();

    // 7. Send the email using the Resend utility you built
    await sendOtpEmail(department.contactEmail, otpCode);

    // 8. Return success and instruct the frontend to show the OTP screen
    return NextResponse.json(
      {
        success: true,
        status: "OTP_REQUIRED",
        message: "Verification code sent successfully",
        email: department.contactEmail,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    // This perfectly catches your thrown Errors and formats them
    return handleErrorResponse(error);
  }
}
