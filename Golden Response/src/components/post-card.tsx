import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { PostCard as PostCardType } from "@/types/post";
import { formatDate } from "@/lib/format";

export function PostCard({ post }: { post: PostCardType }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <Link
        href={`/posts/${post.slug}`}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={post.title}
      >
        {post.coverImage ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 380px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-muted to-accent" />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs">
          {post.category && (
            <Link href={`/category/${post.category.slug}`}>
              <Badge variant="primary">{post.category.name}</Badge>
            </Link>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> {post.readMinutes} min read
          </span>
        </div>

        <h2 className="font-serif text-xl font-semibold leading-snug tracking-tight">
          <Link
            href={`/posts/${post.slug}`}
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => (
              <Link key={t.slug} href={`/tag/${t.slug}`}>
                <Badge variant="outline">#{t.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t pt-4">
          <Link
            href={`/u/${post.author.username}`}
            className="flex items-center gap-2 text-sm focus-visible:outline-none focus-visible:underline"
          >
            <Avatar className="h-7 w-7">
              {post.author.avatarUrl && <AvatarImage src={post.author.avatarUrl} alt="" />}
              <AvatarFallback>{post.author.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{post.author.name}</span>
          </Link>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {post.likeCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" /> {post.commentCount}
            </span>
          </div>
        </div>

        {post.publishedAt && (
          <time className="mt-3 text-xs text-muted-foreground" dateTime={post.publishedAt}>
            {formatDate(post.publishedAt)}
          </time>
        )}
      </div>
    </article>
  );
}
