import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { postFullSelect, serializePost } from "@/lib/posts";
import { PostForm } from "@/components/editor/post-form";
import type { PostCard } from "@/types/post";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/compose/${params.id}`);

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: postFullSelect,
  });
  if (!post) notFound();
  if (post.author.id !== session.user.id) notFound();

  const serialized = JSON.parse(JSON.stringify(serializePost(post))) as PostCard & {
    contentHtml: string;
  };

  return <PostForm post={serialized} />;
}
