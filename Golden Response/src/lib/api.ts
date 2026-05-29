import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Every API response is structured JSON: a clear success payload or a clear
// error with a message and the right status code.

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: { message, details } },
    { status },
  );
}

export const Errors = {
  unauthorized: () => fail("You must be signed in to do that.", 401),
  forbidden: () => fail("You don't have permission to do that.", 403),
  notFound: (what = "Resource") => fail(`${what} not found.`, 404),
  rateLimited: () =>
    fail("Too many requests. Please slow down and try again shortly.", 429),
  server: () => fail("Something went wrong on our end.", 500),
};

/** Convert a Zod error into a structured 400 with field-level messages. */
export function validationError(error: ZodError) {
  const details = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  const first = details[0]?.message ?? "Invalid input.";
  return fail(first, 400, details);
}
