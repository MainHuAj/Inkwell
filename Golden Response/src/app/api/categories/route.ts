import { CATEGORIES } from "@/lib/categories";
import { ok } from "@/lib/api";

// GET /api/categories — the fixed category set.
export async function GET() {
  return ok({ categories: CATEGORIES });
}
