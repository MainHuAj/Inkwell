import { SearchClient } from "@/components/search-client";

export const metadata = { title: "Search — Inkwell" };

export default function SearchPage() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="font-serif text-3xl font-bold tracking-tight">Search</h1>
      <p className="mt-1 text-muted-foreground">
        Find posts by title or content.
      </p>
      <SearchClient />
    </div>
  );
}
