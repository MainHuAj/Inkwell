import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { auth } from "@/auth";
import { getProfile, getUserPublishedPosts } from "@/lib/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { FadeRise, PageFade } from "@/components/motion";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const username = params.username.toLowerCase();
  const profile = await getProfile(username);
  if (!profile) notFound();

  const session = await auth();
  const isMe = session?.user?.id === profile.id;
  const posts = await getUserPublishedPosts(profile.id);

  return (
    <PageFade>
      <div className="container max-w-4xl py-12">
        <header className="flex flex-col items-center gap-4 border-b pb-10 text-center">
          <Avatar className="h-24 w-24">
            {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
            <AvatarFallback className="text-2xl">
              {profile.name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">{profile.name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          {profile.bio && (
            <p className="max-w-xl text-pretty text-muted-foreground">{profile.bio}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {profile._count.posts} {profile._count.posts === 1 ? "post" : "posts"} · Joined{" "}
            {formatDate(profile.createdAt)}
          </p>
          {isMe && (
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" /> Edit profile
              </Link>
            </Button>
          )}
        </header>

        <div className="mt-10">
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
              {isMe ? "You haven't published anything yet." : "No published posts yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <FadeRise key={post.id} delay={Math.min(i, 5) * 0.04}>
                  <PostCard post={post} />
                </FadeRise>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageFade>
  );
}
