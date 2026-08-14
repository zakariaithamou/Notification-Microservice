import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Student from "@/db/models/Student";
import Department from "@/db/models/Department";
import { handleErrorResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      departmentId,
      firstName,
      lastName,
      email,
      phone,
      annee,
      cycle,
      filiere,
    } = body;

    // 1. Check if the department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department not found." },
        { status: 404 },
      );
    }

    // 2. Validate the Cycle matches the Department's Program Type
    if (
      department.programType === "prepa_ingenieur" &&
      !["preparatoire", "ingenieur"].includes(cycle)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid cycle. ${department.name} only supports preparatoire or ingenieur.`,
        },
        { status: 400 },
      );
    }
    if (
      department.programType === "licence_master" &&
      !["licence", "master"].includes(cycle)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid cycle. ${department.name} only supports licence or master.`,
        },
        { status: 400 },
      );
    }

    // 3. Validate the Filière based on the Cycle
    let validatedFiliere = filiere ? filiere.toUpperCase() : undefined;

    if (cycle === "preparatoire") {
      // Prépa has no filière, so we wipe it out just in case the frontend sent one
      validatedFiliere = undefined;
    } else {
      // For Ingenieur, Licence, or Master, they MUST have a valid filière
      if (!validatedFiliere) {
        return NextResponse.json(
          {
            success: false,
            error: `A filiere is required for cycle ${cycle}.`,
          },
          { status: 400 },
        );
      }

      // Check if the requested filiere code actually exists in the department
      const cycleKey = cycle as "ingenieur" | "licence" | "master";

      const isValidFiliere = department.filieres[cycleKey]?.some(
        (f: { code: string }) => f.code === validatedFiliere,
      );
      if (!isValidFiliere) {
        return NextResponse.json(
          {
            success: false,
            error: `Filiere code '${validatedFiliere}' does not exist in ${department.name} for cycle ${cycle}.`,
          },
          { status: 400 },
        );
      }
    }

    // 4. Create the student using the validated data
    const newStudent = await Student.create({
      departmentId,
      firstName,
      lastName,
      email,
      phone,
      annee,
      cycle,
      filiere: validatedFiliere,
    });

    return NextResponse.json(
      { success: true, data: newStudent },
      { status: 201 },
    );
  } catch (error: unknown) {
    // If there's a duplicate email error (MongoDB code 11000), handleErrorResponse will catch it
    return handleErrorResponse(error);
  }
}
