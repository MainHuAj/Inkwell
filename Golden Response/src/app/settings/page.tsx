import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile-form";
import { PageFade } from "@/components/motion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Inkwell" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true, bio: true, avatarUrl: true },
  });
  if (!user) redirect("/login");

  return (
    <PageFade>
      <div className="container max-w-xl py-12">
        <h1 className="font-serif text-3xl font-bold tracking-tight">Profile settings</h1>
        <p className="mt-1 text-muted-foreground">
          Update how you appear across Inkwell.
        </p>
        <div className="mt-8">
          <ProfileForm
            initial={{
              name: user.name,
              username: user.username,
              bio: user.bio ?? "",
              avatarUrl: user.avatarUrl ?? null,
            }}
          />
        </div>
      </div>
    </PageFade>
  );
}
