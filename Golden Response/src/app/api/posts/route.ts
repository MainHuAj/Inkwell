import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, created, fail, validationError, Errors } from "@/lib/api";
import { postCreateSchema } from "@/lib/validations";
import {
  postCardSelect,
  serializePost,
  uniqueSlug,
  resolveTags,
} from "@/lib/posts";
import { sanitizeHtml } from "@/lib/sanitize";
import { htmlToPlainText, buildExcerpt, estimateReadMinutes } from "@/lib/read-time";
import { CATEGORIES } from "@/lib/categories";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { logError } from "@/lib/logger";

const PAGE_SIZE = 10;

// GET /api/posts — public feed of PUBLISHED posts, newest-first, cursor paginated.
// Optional filters: ?tag=, ?category=, ?author=<username>.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get("cursor");
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const author = searchParams.get("author");

    const where: Prisma.PostWhereInput = {
      status: "PUBLISHED",
      ...(tag ? { tags: { some: { tag: { slug: tag.toLowerCase() } } } } : {}),
      ...(category ? { category: { slug: category.toLowerCase() } } : {}),
      ...(author ? { author: { username: author.toLowerCase() } } : {}),
    };

    const posts = await prisma.post.findMany({
      where,
      select: postCardSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = posts.length > PAGE_SIZE;
    const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

    return ok({
      posts: page.map(serializePost),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    await logError("posts.list", error);
    return Errors.server();
  }
}

// POST /api/posts — create a post (draft or published). Auth required.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const limit = rateLimit(`post-create:${session.user.id}:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return Errors.rateLimited();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = postCreateSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const { title, contentHtml, coverImage, categorySlug, tags, publish } = parsed.data;

  if (publish && !categorySlug) {
    return fail("Pick a category before publishing.", 400);
  }

  try {
    const cleanHtml = sanitizeHtml(contentHtml);
    const plain = htmlToPlainText(cleanHtml);
    const slug = await uniqueSlug(title);
    const tagIds = await resolveTags(tags);

    const category = categorySlug
      ? CATEGORIES.find((c) => c.slug === categorySlug)
      : undefined;
    const categoryRow = category
      ? await prisma.category.findUnique({ where: { slug: category.slug }, select: { id: true } })
      : null;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        contentHtml: cleanHtml,
        excerpt: buildExcerpt(plain),
        coverImage: coverImage || null,
        readMinutes: estimateReadMinutes(plain),
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
        authorId: session.user.id,
        categoryId: categoryRow?.id ?? null,
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
      select: postCardSelect,
    });

    return created(serializePost(post));
  } catch (error) {
    await logError("posts.create", error, { userId: session.user.id });
    return Errors.server();
  }
}
