import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Clock, PenLine } from "lucide-react";
import { auth } from "@/auth";
import {
  getPostBySlug,
  getViewerPostState,
  getComments,
} from "@/lib/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostActions } from "@/components/post-actions";
import { CommentSection } from "@/components/comment-section";
import { PageFade } from "@/components/motion";
import { formatDate } from "@/lib/format";
import type { CommentItem } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const viewerId = session?.user?.id;

  const post = await getPostBySlug(params.slug, viewerId);
  if (!post) notFound();

  const [state, rawComments] = await Promise.all([
    getViewerPostState(post.id, viewerId),
    getComments(post.id),
  ]);
  const comments = JSON.parse(JSON.stringify(rawComments)) as CommentItem[];
  const isAuthor = post.author.id === viewerId;

  return (
    <PageFade>
      <article className="container max-w-3xl py-12">
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            {post.status === "DRAFT" && <Badge variant="outline">Draft preview</Badge>}
            {post.category && (
              <Link href={`/category/${post.category.slug}`}>
                <Badge variant="primary">{post.category.name}</Badge>
              </Link>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> {post.readMinutes} min read
            </span>
          </div>

          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
            {post.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <Link href={`/u/${post.author.username}`} className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} alt="" />}
                <AvatarFallback>{post.author.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium leading-tight">{post.author.name}</p>
                {post.publishedAt && (
                  <time className="text-sm text-muted-foreground" dateTime={post.publishedAt}>
                    {formatDate(post.publishedAt)}
                  </time>
                )}
              </div>
            </Link>

            {isAuthor && (
              <Button variant="outline" asChild>
                <Link href={`/compose/${post.id}`}>
                  <PenLine className="h-4 w-4" /> Edit
                </Link>
              </Button>
            )}
          </div>
        </header>

        {post.coverImage && (
          <div className="relative mb-10 aspect-[2/1] overflow-hidden rounded-xl border bg-muted">
            <Image
              src={post.coverImage}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        <div
          className="prose"
          // Server-sanitized on write; rendering stored clean HTML.
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t pt-6">
            {post.tags.map((t) => (
              <Link key={t.slug} href={`/tag/${t.slug}`}>
                <Badge variant="outline">#{t.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {post.status === "PUBLISHED" && (
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <PostActions
              postId={post.id}
              initialLikes={post.likeCount}
              initialLiked={state.liked}
              initialBookmarked={state.bookmarked}
            />
          </div>
        )}

        {post.status === "PUBLISHED" && (
          <CommentSection postId={post.id} initialComments={comments} />
        )}
      </article>
    </PageFade>
  );
}
