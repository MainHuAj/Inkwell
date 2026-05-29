import Link from "next/link";
import { getFeedPage, getTagBySlug } from "@/lib/queries";
import { Feed } from "@/components/feed";
import { PageFade } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: { slug: string } }) {
  const slug = params.slug.toLowerCase();
  const tag = await getTagBySlug(slug);
  const { posts, nextCursor } = await getFeedPage({ tag: slug });

  return (
    <PageFade>
      <div className="container py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            ← Back to feed
          </Link>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
            #{tag?.name ?? slug}
          </h1>
          <p className="mt-1 text-muted-foreground">Posts tagged with this topic.</p>
        </div>
        <Feed
          initialPosts={posts}
          initialCursor={nextCursor}
          query={{ tag: slug }}
          emptyMessage={`Nothing tagged #${tag?.name ?? slug} yet.`}
        />
      </div>
    </PageFade>
  );
}
