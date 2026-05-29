import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, fail, validationError, Errors } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validations";
import { logError } from "@/lib/logger";

// GET /api/me — the signed-in user's profile.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
    },
  });
  if (!user) return Errors.notFound("User");
  return ok({ user });
}

// PATCH /api/me — update display name, bio, and avatar.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = updateProfileSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio || null;
  if (parsed.data.avatarUrl !== undefined) data.avatarUrl = parsed.data.avatarUrl || null;

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, username: true, bio: true, avatarUrl: true },
    });
    return ok({ user });
  } catch (error) {
    await logError("me.update", error, { userId: session.user.id });
    return Errors.server();
  }
}
