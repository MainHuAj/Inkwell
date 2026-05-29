"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { LIMITS, isAllowedImageType } from "@/lib/validations";

type Initial = {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
};

export function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [name, setName] = React.useState(initial.name);
  const [bio, setBio] = React.useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(initial.avatarUrl);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedImageType(file.type)) {
      toast({ variant: "destructive", title: "Unsupported image type" });
      return;
    }
    if (file.size > LIMITS.uploadMaxBytes) {
      toast({ variant: "destructive", title: "Image too large", description: "Max 5 MB." });
      return;
    }
    const form = new FormData();
    form.append("file", file);
    setUploading(true);
    try {
      const data = await apiFetch<{ url: string }>("/api/uploads", { method: "POST", body: form });
      setAvatarUrl(data.url);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Name can't be empty" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), bio, avatarUrl }),
      });
      await update({ name: name.trim(), image: avatarUrl });
      toast({ variant: "success", title: "Profile updated" });
      router.refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't save",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-xl">{name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Change avatar"}
          </Button>
          {avatarUrl && (
            <Button type="button" variant="ghost" className="ml-2" onClick={() => setAvatarUrl(null)}>
              Remove
            </Button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickAvatar} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={initial.username} disabled />
        <p className="text-xs text-muted-foreground">Usernames can&apos;t be changed.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={LIMITS.bioMax}
          placeholder="A sentence or two about you."
        />
        <p className="text-xs text-muted-foreground">
          {bio.length}/{LIMITS.bioMax}
        </p>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
