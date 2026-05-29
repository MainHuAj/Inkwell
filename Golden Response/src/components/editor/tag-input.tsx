"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function add(raw: string) {
    const tag = raw.trim().replace(/^#/, "");
    if (!tag) return;
    // Dedupe case-insensitively.
    const exists = value.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (!exists && value.length < 8) onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-card p-2">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium"
        >
          #{tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Add tags (press Enter)…"}
        className="h-7 flex-1 border-0 bg-transparent p-0 px-1 shadow-none focus-visible:ring-0"
        aria-label="Add a tag"
      />
    </div>
  );
}
