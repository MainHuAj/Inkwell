"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CoverUpload } from "@/components/editor/cover-upload";
import { TagInput } from "@/components/editor/tag-input";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { LIMITS } from "@/lib/validations";
import { CATEGORIES } from "@/lib/categories";
import type { PostCard } from "@/types/post";

// Lazy-load the editor (and ProseMirror with it) so first paint stays quick.
const TiptapEditor = dynamic(() => import("@/components/editor/tiptap-editor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border">
      <div className="h-12 border-b bg-muted/30" />
      <div className="min-h-[50vh] animate-pulse bg-muted/10" />
    </div>
  ),
});

type ExistingPost = PostCard & { contentHtml: string };

export function PostForm({ post }: { post?: ExistingPost }) {
  const router = useRouter();
  const editing = !!post;

  const [title, setTitle] = React.useState(post?.title ?? "");
  const [html, setHtml] = React.useState(post?.contentHtml ?? "");
  const [coverImage, setCoverImage] = React.useState<string | null>(post?.coverImage ?? null);
  const [categorySlug, setCategorySlug] = React.useState<string | null>(
    post?.category?.slug ?? null,
  );
  const [tags, setTags] = React.useState<string[]>(post?.tags.map((t) => t.name) ?? []);
  const [busy, setBusy] = React.useState<null | "draft" | "publish">(null);

  const isPublished = post?.status === "PUBLISHED";

  async function save(publish: boolean) {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Add a title first" });
      return;
    }
    if (publish && !categorySlug) {
      toast({ variant: "destructive", title: "Pick a category to publish" });
      return;
    }
    setBusy(publish ? "publish" : "draft");

    const payload = {
      title: title.trim(),
      contentHtml: html,
      coverImage,
      categorySlug,
      tags,
      publish,
    };

    try {
      const result = editing
        ? await apiFetch<PostCard>(`/api/posts/${post!.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch<PostCard>("/api/posts", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      toast({
        variant: "success",
        title: publish ? "Published" : "Draft saved",
      });

      if (publish) {
        router.push(`/posts/${result.slug}`);
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">
          {editing ? "Edit post" : "New post"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save(false)} disabled={busy !== null}>
            {busy === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button onClick={() => save(true)} disabled={busy !== null}>
            {busy === "publish" ? "Publishing…" : isPublished ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title" className="sr-only">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={LIMITS.titleMax}
            placeholder="Post title"
            className="h-auto border-0 bg-transparent px-0 font-serif text-3xl font-bold shadow-none focus-visible:ring-0"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {title.length}/{LIMITS.titleMax}
          </p>
        </div>

        <CoverUpload value={coverImage} onChange={setCoverImage} />

        <TiptapEditor initialHtml={post?.contentHtml ?? ""} onChange={setHtml} />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categorySlug ?? undefined} onValueChange={setCategorySlug}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Required before publishing.</p>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput value={tags} onChange={setTags} />
            <p className="text-xs text-muted-foreground">Up to 8. Case-insensitive.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
