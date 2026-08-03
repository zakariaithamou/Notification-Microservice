import mongoose from "mongoose";
import Template from "@/db/models/Template";
import Student from "@/db/models/Student";
import { IDepartment } from "@/db/models/Department"; // Make sure this path matches your project

// 1. Define the exact shape of the incoming JSON body
export interface DispatchPayload {
  templateId: string;
  recipientEmail?: string;
  filters?: Record<string, string | number | boolean>;
}

// 2. Replace 'any' with strict types
export async function processB2BDispatch(
  payload: DispatchPayload,
  authenticatedDept: IDepartment,
) {
  // 1. VALIDATE THE TEMPLATE ID
  if (!payload.templateId) {
    return {
      success: false,
      status: 400,
      error: "BAD REQUEST: templateId is required",
    };
  }

  if (!mongoose.Types.ObjectId.isValid(payload.templateId)) {
    return {
      success: false,
      status: 400,
      error: "BAD REQUEST: Invalid templateId format",
    };
  }

  // 2. FETCH AND VERIFY THE TEMPLATE
  const template = await Template.findById(payload.templateId);

  if (!template) {
    return {
      success: false,
      status: 404,
      error: "NOT FOUND: Template does not exist",
    };
  }

  if (String(template.departmentId) !== String(authenticatedDept._id)) {
    return {
      success: false,
      status: 403,
      error: "FORBIDDEN: You do not own this template",
    };
  }

  if (!authenticatedDept.allowedChannels.includes(template.channel)) {
    return {
      success: false,
      status: 403,
      error: `FORBIDDEN: Department is not authorized for channel: ${template.channel}`,
    };
  }

  // 3. RESOLVE RECIPIENTS
  let recipients = [];

  if (payload.recipientEmail) {
    const student = await Student.findOne({
      email: payload.recipientEmail,
      departmentId: authenticatedDept._id,
    }).lean();

    if (!student) {
      return {
        success: false,
        status: 404,
        error: "NOT FOUND: Student not found in your directory",
      };
    }
    recipients.push(student);
  } else if (payload.filters) {
    recipients = await Student.find({
      departmentId: authenticatedDept._id,
      ...payload.filters,
    }).lean();

    if (recipients.length === 0) {
      return {
        success: false,
        status: 404,
        error: "NOT FOUND: No students match these filters",
      };
    }
  } else {
    return {
      success: false,
      status: 400,
      error: "BAD REQUEST: Missing recipientEmail or filters",
    };
  }

  // 4. PROCESS DYNAMIC VARIABLES
  const messagesToDispatch = recipients.map((student) => {
    let personalizedBody = template.body;

    personalizedBody = personalizedBody.replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => {
        // Safely tell TypeScript that 'student' acts like a dictionary
        const studentData = student as Record<string, unknown>;
        return studentData[key] ? String(studentData[key]) : match;
      },
    );

    return {
      to: student.email,
      channel: template.channel,
      subject: template.subject,
      body: personalizedBody,
    };
  });

  return {
    success: true,
    data: messagesToDispatch,
  };
}
