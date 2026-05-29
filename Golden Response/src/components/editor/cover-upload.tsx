"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { LIMITS, isAllowedImageType } from "@/lib/validations";

export function CoverUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
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
      onChange(data.url);
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

  if (value) {
    return (
      <div className="relative aspect-[2/1] overflow-hidden rounded-lg border bg-muted">
        <Image src={value} alt="Cover" fill className="object-cover" sizes="(max-width:768px) 100vw, 768px" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" /> Remove
        </Button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex aspect-[3/1] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ImagePlus className="h-6 w-6" />
        <span className="text-sm">{uploading ? "Uploading…" : "Add a cover image"}</span>
      </button>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
    </>
  );
}
