import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-serif text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="mt-4 font-serif text-2xl font-semibold">This page wandered off.</h1>
      <p className="mt-2 text-muted-foreground">
        The post or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to the feed</Link>
      </Button>
    </div>
  );
}
