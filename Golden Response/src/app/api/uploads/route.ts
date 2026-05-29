import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { ok, fail, Errors } from "@/lib/api";
import { LIMITS, isAllowedImageType } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { logError } from "@/lib/logger";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// POST /api/uploads — multipart form upload of one image to the local
// filesystem. Only the resulting public path is returned (and later stored in
// Postgres); the binary never touches the database.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Errors.unauthorized();

  const limit = rateLimit(`upload:${session.user.id}:${clientIp(req)}`, 40, 60 * 1000);
  if (!limit.ok) return Errors.rateLimited();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("Expected a multipart form upload.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return fail("No file provided under the 'file' field.", 400);
  }

  if (!isAllowedImageType(file.type)) {
    return fail("Only JPEG, PNG, WebP, or GIF images are allowed.", 415);
  }
  if (file.size > LIMITS.uploadMaxBytes) {
    return fail("Images must be 5 MB or smaller.", 413);
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const ext = EXT_BY_TYPE[file.type] ?? "bin";
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);

    const url = `/uploads/${filename}`;
    return ok({ url });
  } catch (error) {
    await logError("uploads", error, { userId: session.user.id });
    return Errors.server();
  }
}
