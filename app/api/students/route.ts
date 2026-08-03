import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Student from "@/db/models/Student";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const newStudent = await Student.create(body);

    return NextResponse.json(
      { success: true, data: newStudent },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
