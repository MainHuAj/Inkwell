import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify, randomSuffix } from "@/lib/slug";

// Shape returned for feed cards and post pages. Counts come from _count so we
// don't ship every like/comment row to the client.
export const postCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  status: true,
  readMinutes: true,
  publishedAt: true,
  createdAt: true,
  author: { select: { id: true, name: true, username: true, avatarUrl: true } },
  category: { select: { name: true, slug: true } },
  tags: { select: { tag: { select: { name: true, slug: true } } } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostSelect;

export const postFullSelect = {
  ...postCardSelect,
  contentHtml: true,
  author: {
    select: { id: true, name: true, username: true, avatarUrl: true, bio: true },
  },
} satisfies Prisma.PostSelect;

type RawPost = Prisma.PostGetPayload<{ select: typeof postCardSelect }> & {
  contentHtml?: string;
  author: { bio?: string | null };
};

/** Flatten tags and counts into a clean JSON shape for the client. */
export function serializePost(post: RawPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    status: post.status,
    readMinutes: post.readMinutes,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    category: post.category,
    tags: post.tags.map((t) => t.tag),
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    ...(post.contentHtml !== undefined ? { contentHtml: post.contentHtml } : {}),
  };
}

export type SerializedPost = ReturnType<typeof serializePost>;

/** Generate a unique slug from a title, appending a suffix on collision. */
export async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${randomSuffix()}`;
  }
  return `${base}-${randomSuffix(10)}`;
}

/**
 * Upsert tags by case-insensitive slug so "NextJS" and "nextjs" collapse into
 * one tag, keeping the first-seen display casing. Returns the tag IDs.
 */
export async function resolveTags(names: string[]): Promise<string[]> {
  const bySlug = new Map<string, string>(); // slug -> display name
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugify(trimmed);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, trimmed);
  }

  const ids: string[] = [];
  for (const [slug, display] of bySlug) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { slug, name: display },
      select: { id: true },
    });
    ids.push(tag.id);
  }
  return ids;
}
