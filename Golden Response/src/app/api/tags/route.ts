import { prisma } from "@/lib/prisma";
import { ok, Errors } from "@/lib/api";
import { logError } from "@/lib/logger";

// GET /api/tags — most-used tags (for the discovery rail / autocomplete).
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
        slug: true,
        _count: { select: { posts: true } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 30,
    });
    return ok({
      tags: tags
        .filter((t) => t._count.posts > 0)
        .map((t) => ({ name: t.name, slug: t.slug, count: t._count.posts })),
    });
  } catch (error) {
    await logError("tags.list", error);
    return Errors.server();
  }
}
