"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { relativeTime } from "@/lib/format";
import { LIMITS } from "@/lib/validations";
import type { CommentItem } from "@/types/post";

export function CommentSection({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: CommentItem[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;

  const [comments, setComments] = React.useState(initialComments);
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editBody, setEditBody] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const data = await apiFetch<{ comment: CommentItem }>(
        `/api/posts/${postId}/comments`,
        { method: "POST", body: JSON.stringify({ body: text }) },
      );
      setComments((prev) => [...prev, data.comment]);
      setBody("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't post comment",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function saveEdit(id: string) {
    const text = editBody.trim();
    if (!text) return;
    try {
      const data = await apiFetch<{ comment: CommentItem }>(`/api/comments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ body: text }),
      });
      setComments((prev) => prev.map((c) => (c.id === id ? data.comment : c)));
      setEditingId(null);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't update comment",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function remove(id: string) {
    const prev = comments;
    setComments((c) => c.filter((x) => x.id !== id));
    try {
      await apiFetch(`/api/comments/${id}`, { method: "DELETE" });
    } catch {
      setComments(prev);
      toast({ variant: "destructive", title: "Couldn't delete comment" });
    }
  }

  return (
    <section aria-label="Comments" className="mt-16">
      <h2 className="font-serif text-2xl font-semibold">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {status === "authenticated" ? (
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="comment-body" className="sr-only">
            Write a comment
          </label>
          <Textarea
            id="comment-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={LIMITS.commentMax}
            placeholder="Add to the conversation…"
            className="min-h-[100px]"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {body.length}/{LIMITS.commentMax}
            </span>
            <Button type="submit" disabled={submitting || !body.trim()}>
              {submitting ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="mt-8 space-y-6">
        {comments.map((c) => {
          const mine = c.author.id === userId;
          const edited = c.updatedAt !== c.createdAt;
          return (
            <li key={c.id} className="flex gap-3">
              <Link href={`/u/${c.author.username}`} className="shrink-0">
                <Avatar className="h-9 w-9">
                  {c.author.avatarUrl && <AvatarImage src={c.author.avatarUrl} alt="" />}
                  <AvatarFallback>{c.author.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <Link href={`/u/${c.author.username}`} className="font-medium hover:underline">
                    {c.author.name}
                  </Link>
                  <span className="text-muted-foreground">·</span>
                  <time className="text-xs text-muted-foreground" dateTime={c.createdAt}>
                    {relativeTime(c.createdAt)}
                    {edited && " (edited)"}
                  </time>
                </div>

                {editingId === c.id ? (
                  <div className="mt-2">
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      maxLength={LIMITS.commentMax}
                      className="min-h-[80px]"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(c.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-[0.95rem] leading-relaxed">
                    {c.body}
                  </p>
                )}

                {mine && editingId !== c.id && (
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <button
                      className="hover:text-foreground hover:underline"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditBody(c.body);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="hover:text-destructive hover:underline"
                      onClick={() => remove(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
