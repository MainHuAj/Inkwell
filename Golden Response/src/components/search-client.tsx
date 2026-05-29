"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { apiFetch } from "@/lib/client";
import type { PostCard as PostCardType } from "@/types/post";

type SearchResponse = {
  posts: PostCardType[];
  nextPage: number | null;
  query: string;
};

export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";

  const [q, setQ] = React.useState(initialQ);
  const [posts, setPosts] = React.useState<PostCardType[]>([]);
  const [nextPage, setNextPage] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  const runSearch = React.useCallback(async (query: string, page: number) => {
    if (query.trim().length < 2) {
      setPosts([]);
      setNextPage(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<SearchResponse>(
        `/api/search?q=${encodeURIComponent(query)}&page=${page}`,
      );
      setPosts((prev) => (page === 0 ? data.posts : [...prev, ...data.posts]));
      setNextPage(data.nextPage);
      setSearched(true);
    } catch {
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce input by 350ms; keep the URL's ?q= in sync for shareable links.
  React.useEffect(() => {
    const handle = setTimeout(() => {
      runSearch(q, 0);
      const url = q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search";
      router.replace(url, { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mt-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts…"
          className="h-12 pl-10 text-base"
          aria-label="Search posts"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="mt-8">
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
            {nextPage !== null && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={() => runSearch(q, nextPage)} disabled={loading}>
                  {loading ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </>
        ) : searched && !loading ? (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <p className="text-lg font-medium">No results for “{q}”</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try different keywords or a broader term.
            </p>
          </div>
        ) : (
          !searched && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Type at least two characters to search.
            </p>
          )
        )}
      </div>
    </div>
  );
}
