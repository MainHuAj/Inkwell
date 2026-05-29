import DOMPurify from "isomorphic-dompurify";

// Whitelist that matches what the Tiptap editor can produce. Anything outside
// this set (script, iframe, on* handlers, style, etc.) is stripped server-side
// so a post body can never smuggle in stored XSS.
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "u", "s", "code", "pre",
  "h1", "h2", "h3", "h4",
  "ul", "ol", "li",
  "blockquote",
  "a", "img",
  "hr",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title", "class"];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|#)/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}
