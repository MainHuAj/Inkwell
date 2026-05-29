import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, created, fail, validationError, Errors } from "@/lib/api";
import { commentCreateSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { logError } from "@/lib/logger";

type Params = { params: { id: string } };

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
} as const;

// GET /api/posts/:id/comments — oldest-first, the way a conversation reads.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
      select: commentSelect,
      orderBy: { createdAt: "asc" },
    });
    return ok({ comments });
  } catch (error) {
    await logError("comments.list", error);
    return Errors.server();
  }
}

// POST /api/posts/:id/comments — add a comment to a published post.
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const limit = rateLimit(`comment:${session.user.id}:${clientIp(req)}`, 10, 60 * 1000);
  if (!limit.ok) return Errors.rateLimited();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = commentCreateSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!post || post.status !== "PUBLISHED") return Errors.notFound("Post");

    const comment = await prisma.comment.create({
      data: {
        body: parsed.data.body,
        postId: params.id,
        authorId: session.user.id,
      },
      select: commentSelect,
    });
    return created({ comment });
  } catch (error) {
    await logError("comments.create", error, { postId: params.id });
    return Errors.server();
  }
}
