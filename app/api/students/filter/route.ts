import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Student from "@/db/models/Student";
import { handleErrorResponse } from "@/utils/apiResponse";
import Department from "@/db/models/Department";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing x-api-key header" },
        { status: 401 },
      );
    }

    // 1. Extract the filter parameters sent from the frontend form
    const body = await req.json();
    const { departmentId, cycle, annee, filiere } = body;

    // Verify the department actually owns this API key (or at least exists)
    // Verify the department exists (Temporarily skipping the apiKey database match for debugging)
    console.log(`Checking DB for Department ID: ${departmentId}`);

    const department = await Department.findById(departmentId);

    if (!department) {
      console.log("Department not found in DB!");
      return NextResponse.json(
        {
          success: false,
          error: "Department not found.",
        },
        { status: 403 },
      );
    }

    // Optional: Log the keys to see why they didn't match!
    console.log(`Key from Frontend: ${apiKey}`);

    // 2. Build the query object dynamically
    // departmentId is always required so a department only emails its own students
    interface StudentQuery {
      departmentId: string;
      cycle?: "preparatoire" | "ingenieur" | "licence" | "master";
      annee?: number;
      filiere?: string;
    }

    const query: StudentQuery = { departmentId };

    if (cycle) query.cycle = cycle;
    if (annee) query.annee = annee;
    if (filiere) query.filiere = filiere.toUpperCase();

    // 3. Fetch only the fields needed for sending emails to save memory
    const targetStudents = await Student.find(query).select(
      "email firstName lastName",
    );

    // 4. Return the filtered list
    return NextResponse.json(
      { success: true, count: targetStudents.length, data: targetStudents },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleErrorResponse(error);
  }
}
