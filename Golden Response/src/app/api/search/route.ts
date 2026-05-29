import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, Errors } from "@/lib/api";
import { serializePost, postCardSelect } from "@/lib/posts";
import { logError } from "@/lib/logger";

const PAGE_SIZE = 10;

// GET /api/search?q=... — Postgres full-text search across title + body,
// ranked by relevance. Offset-paginated via ?page=.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(0, Number.parseInt(searchParams.get("page") ?? "0", 10) || 0);

  if (q.length < 2) {
    return ok({ posts: [], nextPage: null, query: q });
  }

  try {
    // websearch_to_tsquery understands quoted phrases and OR/-, and never
    // throws on user input the way plain to_tsquery does.
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM "Post"
      WHERE status = 'PUBLISHED'
        AND "searchVector" @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank("searchVector", websearch_to_tsquery('english', ${q})) DESC,
               "publishedAt" DESC
      LIMIT ${PAGE_SIZE + 1} OFFSET ${page * PAGE_SIZE}`;

    const hasMore = rows.length > PAGE_SIZE;
    const ids = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map((r) => r.id);

    // Refetch with the normal selector so the shape matches the feed, then
    // restore the relevance order from the raw query.
    const posts = await prisma.post.findMany({
      where: { id: { in: ids } },
      select: postCardSelect,
    });
    const byId = new Map(posts.map((p) => [p.id, p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean).map((p) => serializePost(p!));

    return ok({
      posts: ordered,
      nextPage: hasMore ? page + 1 : null,
      query: q,
    });
  } catch (error) {
    await logError("search", error, { q });
    return Errors.server();
  }
}
