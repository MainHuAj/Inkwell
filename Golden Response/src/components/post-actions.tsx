"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function PostActions({
  postId,
  initialLikes,
  initialLiked,
  initialBookmarked,
}: {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const authed = status === "authenticated";

  const [likes, setLikes] = React.useState(initialLikes);
  const [liked, setLiked] = React.useState(initialLiked);
  const [bookmarked, setBookmarked] = React.useState(initialBookmarked);
  const [pending, setPending] = React.useState(false);

  function requireAuth() {
    toast({ title: "Sign in required", description: "Log in to interact with posts." });
    router.push("/login");
  }

  async function toggleLike() {
    if (!authed) return requireAuth();
    if (pending) return;
    // optimistic
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => n + (nextLiked ? 1 : -1));
    setPending(true);
    try {
      const data = await apiFetch<{ liked: boolean; likeCount: number }>(
        `/api/posts/${postId}/like`,
        { method: "POST" },
      );
      setLiked(data.liked);
      setLikes(data.likeCount);
    } catch {
      setLiked(!nextLiked);
      setLikes((n) => n + (nextLiked ? -1 : 1));
      toast({ variant: "destructive", title: "Couldn't update like" });
    } finally {
      setPending(false);
    }
  }

  async function toggleBookmark() {
    if (!authed) return requireAuth();
    const next = !bookmarked;
    setBookmarked(next);
    try {
      const data = await apiFetch<{ bookmarked: boolean }>(
        `/api/posts/${postId}/bookmark`,
        { method: "POST" },
      );
      setBookmarked(data.bookmarked);
      toast({
        title: data.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks",
      });
    } catch {
      setBookmarked(!next);
      toast({ variant: "destructive", title: "Couldn't update bookmark" });
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={toggleLike}
        aria-pressed={liked}
        aria-label={liked ? "Unlike this post" : "Like this post"}
        className={cn(liked && "border-primary/50 text-primary")}
      >
        <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        <span>{likes}</span>
      </Button>
      <Button
        variant="outline"
        onClick={toggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
        className={cn(bookmarked && "border-primary/50 text-primary")}
      >
        <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
        <span>{bookmarked ? "Saved" : "Save"}</span>
      </Button>
    </div>
  );
}
