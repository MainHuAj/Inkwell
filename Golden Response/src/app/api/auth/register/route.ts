import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations";
import { created, fail, validationError, Errors } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 / hour / IP
  if (!limit.ok) return Errors.rateLimited();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password, name, username } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, username },
      select: { id: true, email: true, name: true, username: true },
    });
    return created({ user });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined)?.[0] ?? "field";
      const which = target.includes("email") ? "email" : "username";
      return fail(`That ${which} is already taken.`, 409);
    }
    await logError("register", error);
    return Errors.server();
  }
}
