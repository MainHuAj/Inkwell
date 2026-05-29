"use client";

import * as React from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/client";
import { toast } from "@/components/ui/use-toast";
import { LIMITS, isAllowedImageType } from "@/lib/validations";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
        active && "bg-accent text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
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
    try {
      const data = await apiFetch<{ url: string }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b bg-card/95 p-1.5 backdrop-blur">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolbarButton>
      <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton label="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </ToolbarButton>
      <ToolbarButton label="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote />
      </ToolbarButton>
      <ToolbarButton label="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton label="Add link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 />
      </ToolbarButton>
      <ToolbarButton label="Insert image" onClick={() => fileRef.current?.click()}>
        <ImageIcon />
      </ToolbarButton>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      <div className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton label="Undo" onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton label="Redo" onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

export default function TiptapEditor({
  initialHtml = "",
  onChange,
}: {
  initialHtml?: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg border" } }),
      Placeholder.configure({ placeholder: "Tell your story…" }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: "prose max-w-none px-4 py-6",
        "aria-label": "Post body",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="rounded-lg border">
        <div className="h-12 border-b bg-muted/30" />
        <div className="min-h-[50vh] animate-pulse bg-muted/10" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
