import { redirect } from "next/navigation";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { auth } from "@/auth";
import { getDashboardData } from "@/lib/queries";
import { DashboardTabs } from "@/components/dashboard-tabs";
import { Button } from "@/components/ui/button";
import { PageFade } from "@/components/motion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Inkwell" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const { drafts, published, bookmarks } = await getDashboardData(session.user.id);

  return (
    <PageFade>
      <div className="container max-w-4xl py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Your dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your drafts, published posts, and saved reads.
            </p>
          </div>
          <Button asChild>
            <Link href="/compose">
              <PenLine className="h-4 w-4" /> Write
            </Link>
          </Button>
        </div>

        <DashboardTabs published={published} drafts={drafts} bookmarks={bookmarks} />
      </div>
    </PageFade>
  );
}
