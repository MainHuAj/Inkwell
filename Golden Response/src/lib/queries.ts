import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { postCardSelect, postFullSelect, serializePost } from "@/lib/posts";
import type { PostCard } from "@/types/post";

const PAGE_SIZE = 10;

type FeedFilter = { tag?: string; category?: string; author?: string };

/** First page of the published feed, server-rendered. */
export async function getFeedPage(
  filter: FeedFilter = {},
): Promise<{ posts: PostCard[]; nextCursor: string | null }> {
  const where: Prisma.PostWhereInput = {
    status: "PUBLISHED",
    ...(filter.tag ? { tags: { some: { tag: { slug: filter.tag } } } } : {}),
    ...(filter.category ? { category: { slug: filter.category } } : {}),
    ...(filter.author ? { author: { username: filter.author } } : {}),
  };

  const rows = await prisma.post.findMany({
    where,
    select: postCardSelect,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
  });

  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  return {
    posts: page.map(serializePost) as PostCard[],
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export async function getPostBySlug(slug: string, viewerId?: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: postFullSelect,
  });
  if (!post) return null;
  if (post.status === "DRAFT" && post.author.id !== viewerId) return null;
  return serializePost(post) as PostCard & { contentHtml: string };
}

export async function getViewerPostState(postId: string, viewerId?: string) {
  if (!viewerId) return { liked: false, bookmarked: false };
  const [like, bookmark] = await Promise.all([
    prisma.like.findUnique({ where: { userId_postId: { userId: viewerId, postId } } }),
    prisma.bookmark.findUnique({ where: { userId_postId: { userId: viewerId, postId } } }),
  ]);
  return { liked: !!like, bookmarked: !!bookmark };
}

export async function getComments(postId: string) {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      updatedAt: true,
      author: { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });
}

export async function getProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function getUserPublishedPosts(userId: string): Promise<PostCard[]> {
  const rows = await prisma.post.findMany({
    where: { authorId: userId, status: "PUBLISHED" },
    select: postCardSelect,
    orderBy: { publishedAt: "desc" },
  });
  return rows.map(serializePost) as PostCard[];
}

export async function getDashboardData(userId: string) {
  const [drafts, published, bookmarks] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: userId, status: "DRAFT" },
      select: postCardSelect,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findMany({
      where: { authorId: userId, status: "PUBLISHED" },
      select: postCardSelect,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { post: { select: postCardSelect } },
    }),
  ]);

  return {
    drafts: drafts.map(serializePost) as PostCard[],
    published: published.map(serializePost) as PostCard[],
    bookmarks: bookmarks
      .filter((b) => b.post.status === "PUBLISHED")
      .map((b) => serializePost(b.post)) as PostCard[],
  };
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug }, select: { name: true, slug: true } });
}

export async function getTagBySlug(slug: string) {
  return prisma.tag.findUnique({ where: { slug }, select: { name: true, slug: true } });
}
