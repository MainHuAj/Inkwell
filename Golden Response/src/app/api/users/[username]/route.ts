import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, Errors } from "@/lib/api";
import { serializePost, postCardSelect } from "@/lib/posts";
import { logError } from "@/lib/logger";

type Params = { params: { username: string } };

// GET /api/users/:username — public profile plus their published posts.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        posts: {
          where: { status: "PUBLISHED" },
          select: postCardSelect,
          orderBy: { publishedAt: "desc" },
        },
      },
    });
    if (!user) return Errors.notFound("User");

    const { posts, ...profile } = user;
    return ok({ user: profile, posts: posts.map(serializePost) });
  } catch (error) {
    await logError("users.get", error);
    return Errors.server();
  }
}
