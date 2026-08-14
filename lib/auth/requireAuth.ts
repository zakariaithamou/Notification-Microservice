import { getSession } from "./session";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Not authenticated");
  }
  return session.departmentId;
}
