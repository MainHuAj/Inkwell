import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ok, fail, validationError, Errors } from "@/lib/api";
import { postUpdateSchema } from "@/lib/validations";
import {
  postFullSelect,
  serializePost,
  uniqueSlug,
  resolveTags,
} from "@/lib/posts";
import { sanitizeHtml } from "@/lib/sanitize";
import { htmlToPlainText, buildExcerpt, estimateReadMinutes } from "@/lib/read-time";
import { CATEGORIES } from "@/lib/categories";
import { logError } from "@/lib/logger";

type Params = { params: { id: string } };

// GET /api/posts/:id — full post. Drafts are only visible to their author.
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: postFullSelect,
    });
    if (!post) return Errors.notFound("Post");
    if (post.status === "DRAFT" && post.author.id !== session?.user?.id) {
      return Errors.notFound("Post");
    }
    return ok(serializePost(post));
  } catch (error) {
    await logError("posts.get", error);
    return Errors.server();
  }
}

// PATCH /api/posts/:id — edit own post. An optional `publish` flag flips state.
// Editing never touches existing comments or likes.
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, status: true, title: true, slug: true },
  });
  if (!existing) return Errors.notFound("Post");
  if (existing.authorId !== session.user.id) return Errors.forbidden();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = postUpdateSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const willPublish =
    input.publish === true || (input.publish === undefined && existing.status === "PUBLISHED");
  const categorySlug = input.categorySlug;

  if (willPublish && categorySlug === undefined && existing.status !== "PUBLISHED") {
    // publishing for the first time requires a category
    return fail("Pick a category before publishing.", 400);
  }

  try {
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) {
      data.title = input.title;
      data.slug = await uniqueSlug(input.title, existing.id);
    }

    if (input.contentHtml !== undefined) {
      const cleanHtml = sanitizeHtml(input.contentHtml);
      const plain = htmlToPlainText(cleanHtml);
      data.contentHtml = cleanHtml;
      data.excerpt = buildExcerpt(plain);
      data.readMinutes = estimateReadMinutes(plain);
    }

    if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;

    if (categorySlug !== undefined) {
      if (categorySlug === null) {
        data.categoryId = null;
      } else {
        const cat = CATEGORIES.find((c) => c.slug === categorySlug);
        const row = cat
          ? await prisma.category.findUnique({ where: { slug: cat.slug }, select: { id: true } })
          : null;
        data.categoryId = row?.id ?? null;
      }
    }

    if (input.publish !== undefined) {
      data.status = input.publish ? "PUBLISHED" : "DRAFT";
      if (input.publish && existing.status !== "PUBLISHED") {
        data.publishedAt = new Date();
      }
      if (!input.publish) {
        data.publishedAt = null;
      }
    }

    if (input.tags !== undefined) {
      const tagIds = await resolveTags(input.tags);
      data.tags = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      };
    }

    const post = await prisma.post.update({
      where: { id: existing.id },
      data,
      select: postFullSelect,
    });

    return ok(serializePost(post));
  } catch (error) {
    await logError("posts.update", error, { postId: params.id });
    return Errors.server();
  }
}

// DELETE /api/posts/:id — delete own post (cascades comments/likes/bookmarks).
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const existing = await prisma.post.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  if (!existing) return Errors.notFound("Post");
  if (existing.authorId !== session.user.id) return Errors.forbidden();

  try {
    await prisma.post.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    await logError("posts.delete", error, { postId: params.id });
    return Errors.server();
  }
}
