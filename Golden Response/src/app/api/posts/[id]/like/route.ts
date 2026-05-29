import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, Errors } from "@/lib/api";
import { logError } from "@/lib/logger";

type Params = { params: { id: string } };

// POST /api/posts/:id/like — toggle the current user's like. One per user/post.
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();
  const userId = session.user.id;
  const postId = params.id;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { status: true },
    });
    if (!post || post.status !== "PUBLISHED") return Errors.notFound("Post");

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
    } else {
      await prisma.like.create({ data: { userId, postId } });
    }

    const likeCount = await prisma.like.count({ where: { postId } });
    return ok({ liked: !existing, likeCount });
  } catch (error) {
    await logError("likes.toggle", error, { postId });
    return Errors.server();
  }
}
