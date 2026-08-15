import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Department from "@/db/models/Department";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/utils/password";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Verify they have a valid session cookie
    const session = await getSession();
    if (!session) {
      throw new Error("UNAUTHORIZED: No active session found.");
    }
    const departmentId = session.departmentId;

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 8) {
      throw new Error(
        "VALIDATION_ERROR: Password must be at least 8 characters",
      );
    }

    // 2. Find the department
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new Error("NOT_FOUND_ERROR: Department not found");
    }

    // 3. Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // 4. Update the password AND remove the expiration timer permanently
    department.passwordHash = hashedPassword;
    department.passwordExpiresAt = undefined;

    await department.save();

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
