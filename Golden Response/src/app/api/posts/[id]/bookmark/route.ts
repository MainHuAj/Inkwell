import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, Errors } from "@/lib/api";
import { logError } from "@/lib/logger";

type Params = { params: { id: string } };

// POST /api/posts/:id/bookmark — toggle a private bookmark for the current user.
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

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
    } else {
      await prisma.bookmark.create({ data: { userId, postId } });
    }

    return ok({ bookmarked: !existing });
  } catch (error) {
    await logError("bookmarks.toggle", error, { postId });
    return Errors.server();
  }
}
