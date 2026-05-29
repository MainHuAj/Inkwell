"use client";

import * as React from "react";
import { PostCard } from "@/components/post-card";
import { FadeRise } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import type { PostCard as PostCardType } from "@/types/post";

type FeedResponse = { posts: PostCardType[]; nextCursor: string | null };

export function Feed({
  initialPosts,
  initialCursor,
  query = {},
  emptyMessage = "No posts yet.",
}: {
  initialPosts: PostCardType[];
  initialCursor: string | null;
  query?: Record<string, string>;
  emptyMessage?: string;
}) {
  const [posts, setPosts] = React.useState(initialPosts);
  const [cursor, setCursor] = React.useState(initialCursor);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ ...query, cursor });
      const data = await apiFetch<FeedResponse>(`/api/posts?${params.toString()}`);
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
    } catch {
      setError("Couldn't load more posts. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-20 text-center">
        <p className="text-lg font-medium">{emptyMessage}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check back soon, or be the first to write something.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <FadeRise key={post.id} delay={Math.min(i, 5) * 0.04}>
            <PostCard post={post} />
          </FadeRise>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {cursor ? (
          <Button onClick={loadMore} disabled={loading} variant="outline" size="lg">
            {loading ? "Loading…" : "Load more"}
          </Button>
        ) : (
          posts.length > 0 && (
            <p className="text-sm text-muted-foreground">You&apos;ve reached the end.</p>
          )
        )}
      </div>
    </div>
  );
}
