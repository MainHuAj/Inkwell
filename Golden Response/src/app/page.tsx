import Link from "next/link";
import { getFeedPage } from "@/lib/queries";
import { Feed } from "@/components/feed";
import { PageFade } from "@/components/motion";
import { CATEGORIES } from "@/lib/categories";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { posts, nextCursor } = await getFeedPage();

  return (
    <PageFade>
      <section className="border-b bg-gradient-to-b from-accent/40 to-transparent">
        <div className="container py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Writing worth reading, from anyone with something to say.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
            Inkwell is a flat, multi-author blog. Sign up and you&apos;re a full
            author and reader — write, publish, comment, and bookmark.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`}>
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  {c.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-semibold">Latest</h2>
          <span className="text-sm text-muted-foreground">Newest first</span>
        </div>
        <Feed initialPosts={posts} initialCursor={nextCursor} />
      </div>
    </PageFade>
  );
}
