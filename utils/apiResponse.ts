import { NextResponse } from "next/server";

export function handleErrorResponse(error: unknown) {
  console.error("API Error:", error);

  // 1. Safely extract the error message from the 'unknown' type
  let errorMessage = "An unexpected error occurred.";
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  // 2. Route the specific error types
  if (errorMessage.includes("VALIDATION_ERROR")) {
    return NextResponse.json(
      { success: false, error: errorMessage.replace("VALIDATION_ERROR: ", "") },
      { status: 400 },
    );
  }

  if (errorMessage.includes("DUPLICATE_ERROR")) {
    return NextResponse.json(
      { success: false, error: errorMessage.replace("DUPLICATE_ERROR: ", "") },
      { status: 409 },
    );
  }
  if (errorMessage.includes("NOT_FOUND_ERROR")) {
    return NextResponse.json(
      { success: false, error: errorMessage.replace("NOT_FOUND_ERROR: ", "") },
      { status: 404 },
    );
  }

  if (errorMessage.includes("UNAUTHORIZED")) {
    return NextResponse.json(
      { success: false, error: errorMessage.replace("UNAUTHORIZED: ", "") },
      { status: 401 }, // 401 is the standard HTTP status code for authentication failures
    );
  }

  // 3. Default catch-all for 500 Server Errors
  return NextResponse.json(
    { success: false, error: "Internal server error." },
    { status: 500 },
  );
}
