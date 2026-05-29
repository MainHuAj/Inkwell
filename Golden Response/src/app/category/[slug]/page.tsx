import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeedPage, getCategoryBySlug } from "@/lib/queries";
import { Feed } from "@/components/feed";
import { PageFade } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const slug = params.slug.toLowerCase();
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const { posts, nextCursor } = await getFeedPage({ category: slug });

  return (
    <PageFade>
      <div className="container py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to feed
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">{category.name}</h1>
          <p className="mt-1 text-muted-foreground">Everything filed under {category.name}.</p>
        </div>
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
          query={{ category: slug }}
          emptyMessage={`No posts in ${category.name} yet.`}
        />
      </div>
    </PageFade>
  );
}
