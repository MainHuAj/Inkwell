import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, fail, validationError, Errors } from "@/lib/api";
import { commentUpdateSchema } from "@/lib/validations";
import { logError } from "@/lib/logger";

type Params = { params: { id: string } };

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
} as const;

// PATCH /api/comments/:id — edit own comment.
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const existing = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return Errors.notFound("Comment");
  if (existing.authorId !== session.user.id) return Errors.forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = commentUpdateSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const comment = await prisma.comment.update({
      where: { id: params.id },
      data: { body: parsed.data.body },
      select: commentSelect,
    });
    return ok({ comment });
  } catch (error) {
    await logError("comments.update", error, { commentId: params.id });
    return Errors.server();
  }
}

// DELETE /api/comments/:id — delete own comment.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const existing = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return Errors.notFound("Comment");
  if (existing.authorId !== session.user.id) return Errors.forbidden();

  try {
    await prisma.comment.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    await logError("comments.delete", error, { commentId: params.id });
    return Errors.server();
  }
}
