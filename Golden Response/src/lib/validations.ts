import { z } from "zod";
import { CATEGORY_SLUGS } from "./categories";

// Limits mirror the brief's Data Processing section.
export const LIMITS = {
  titleMax: 120,
  bodyMax: 50_000,
  commentMax: 2000,
  bioMax: 280,
  passwordMin: 8,
  passwordMax: 200,
  uploadMaxBytes: 5 * 1024 * 1024,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

export function isAllowedImageType(type: string): boolean {
  return (LIMITS.allowedImageTypes as readonly string[]).includes(type);
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

const password = z
  .string()
  .min(LIMITS.passwordMin, `Password must be at least ${LIMITS.passwordMin} characters.`)
  .max(LIMITS.passwordMax);

export const registerSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1, "Name is required.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores."),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80).optional(),
  bio: z.string().trim().max(LIMITS.bioMax).optional().or(z.literal("")),
  avatarUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9 +#.\-]*$/, "Tags contain invalid characters.");

export const postCreateSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(LIMITS.titleMax),
  contentHtml: z.string().max(LIMITS.bodyMax, "Post body is too long."),
  coverImage: z.string().trim().max(500).optional().nullable(),
  categorySlug: z.enum(CATEGORY_SLUGS as [string, ...string[]]).optional().nullable(),
  tags: z.array(tagSchema).max(8, "Up to 8 tags.").default([]),
  publish: z.boolean().default(false),
});

export const postUpdateSchema = postCreateSchema.partial().extend({
  publish: z.boolean().optional(),
});

export const commentCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment can't be empty.")
    .max(LIMITS.commentMax, `Comments are limited to ${LIMITS.commentMax} characters.`),
});

export const commentUpdateSchema = commentCreateSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type PostCreateInput = z.infer<typeof postCreateSchema>;
