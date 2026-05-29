"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenLine, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/post-card";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PostCard as PostCardType } from "@/types/post";

type Tab = "published" | "drafts" | "bookmarks";

export function DashboardTabs({
  published,
  drafts,
  bookmarks,
}: {
  published: PostCardType[];
  drafts: PostCardType[];
  bookmarks: PostCardType[];
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>(
    published.length === 0 && drafts.length > 0 ? "drafts" : "published",
  );
  const [localDrafts, setLocalDrafts] = React.useState(drafts);
  const [localPublished, setLocalPublished] = React.useState(published);

  async function remove(id: string, from: Tab) {
    if (!window.confirm("Delete this post permanently? This can't be undone.")) return;
    try {
      await apiFetch(`/api/posts/${id}`, { method: "DELETE" });
      if (from === "drafts") setLocalDrafts((p) => p.filter((x) => x.id !== id));
      else setLocalPublished((p) => p.filter((x) => x.id !== id));
      toast({ title: "Post deleted" });
      router.refresh();
    } catch {
      toast({ variant: "destructive", title: "Couldn't delete post" });
    }
  }

  async function setPublished(post: PostCardType, publish: boolean) {
    try {
      await apiFetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({ publish }),
      });
      if (publish) {
        setLocalDrafts((p) => p.filter((x) => x.id !== post.id));
        setLocalPublished((p) => [{ ...post, status: "PUBLISHED" }, ...p]);
        setTab("published");
      } else {
        setLocalPublished((p) => p.filter((x) => x.id !== post.id));
        setLocalDrafts((p) => [{ ...post, status: "DRAFT" }, ...p]);
        setTab("drafts");
      }
      toast({ variant: "success", title: publish ? "Published" : "Moved to drafts" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't update",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "published", label: "Published", count: localPublished.length },
    { key: "drafts", label: "Drafts", count: localDrafts.length },
    { key: "bookmarks", label: "Bookmarks", count: bookmarks.length },
  ];

  return (
    <div>
      <div className="mb-8 flex gap-1 border-b" role="tablist" aria-label="Dashboard sections">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative -mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}{" "}
            <span className="ml-1 text-xs text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "drafts" && (
        <ManageList
          posts={localDrafts}
          empty="No drafts. Start writing and save one."
          renderActions={(post) => (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/compose/${post.id}`}>
                  <PenLine className="h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button size="sm" onClick={() => setPublished(post, true)}>
                <Eye className="h-4 w-4" /> Publish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(post.id, "drafts")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        />
      )}

      {tab === "published" && (
        <ManageList
          posts={localPublished}
          empty="Nothing published yet."
          renderActions={(post) => (
            <>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/compose/${post.id}`}>
                  <PenLine className="h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPublished(post, false)}>
                <EyeOff className="h-4 w-4" /> Unpublish
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(post.id, "published")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        />
      )}

      {tab === "bookmarks" && (
        <>
          {bookmarks.length === 0 ? (
            <EmptyState message="No bookmarks yet. Save posts you want to return to." />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ManageList({
  posts,
  empty,
  renderActions,
}: {
  posts: PostCardType[];
  empty: string;
  renderActions: (post: PostCardType) => React.ReactNode;
}) {
  if (posts.length === 0) return <EmptyState message={empty} />;
  return (
    <ul className="divide-y rounded-xl border">
      {posts.map((post) => (
        <li key={post.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={post.status === "PUBLISHED" ? `/posts/${post.slug}` : `/compose/${post.id}`}
                className="truncate font-medium hover:underline"
              >
                {post.title || "Untitled"}
              </Link>
              {post.status === "DRAFT" && <Badge variant="outline">Draft</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {post.readMinutes} min ·{" "}
              {post.publishedAt ? formatDate(post.publishedAt) : "not published"} ·{" "}
              {post.likeCount} likes · {post.commentCount} comments
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">{renderActions(post)}</div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
      {message}
    </div>
  );
}
