"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PenLine, Search, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Inkwell home">
          <span className="font-serif text-2xl font-bold tracking-tight">Inkwell</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Main">
          <Button variant="ghost" size="icon" asChild aria-label="Search">
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <ThemeToggle />

          {status === "loading" ? (
            <div className="ml-1 h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <Button asChild className="ml-1 hidden sm:inline-flex">
                <Link href="/compose">
                  <PenLine className="h-4 w-4" />
                  Write
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9">
                      {user.image && <AvatarImage src={user.image} alt="" />}
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="truncate font-medium">{user.name}</span>
                      <span className="truncate text-xs font-normal text-muted-foreground">
                        @{user.username}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/compose" className="sm:hidden">
                      <PenLine /> Write
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/u/${user.username}`}>
                      <UserIcon /> My profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ redirect: false }).then(() => router.push("/"))}
                  >
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="ml-1 flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
