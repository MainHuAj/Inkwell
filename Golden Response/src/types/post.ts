// Plain shapes shared between server and client components (no Prisma import).

export type Author = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio?: string | null;
};

export type TagRef = { name: string; slug: string };
export type CategoryRef = { name: string; slug: string } | null;

export type PostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  readMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  author: Author;
  category: CategoryRef;
  tags: TagRef[];
  likeCount: number;
  commentCount: number;
  contentHtml?: string;
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
};
