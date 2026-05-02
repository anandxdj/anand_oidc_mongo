"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUserRound, KeyRound, Laptop, Lock } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const userNav = [
  { href: "/user/profile", label: "Profile", icon: CircleUserRound },
  { href: "/user/sessions", label: "Sessions", icon: Laptop },
  { href: "/user/apps", label: "Authorized Apps", icon: KeyRound },
] as const;

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ok" | "unauthenticated" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, { credentials: "include" });
        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setState("unauthenticated");
          return;
        }
        if (!res.ok) {
          if (!cancelled) setState("error");
          return;
        }
        const json = (await res.json()) as { data?: { role?: string } };
        if (json.data?.role) {
          if (!cancelled) setState("ok");
          return;
        }
        if (!cancelled) setState("error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const returnTo =
    pathname && pathname.startsWith("/user")
      ? encodeURIComponent(pathname)
      : encodeURIComponent("/user");
  const loginHref = `/login?return_to=${returnTo}`;

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6">
        <Skeleton className="h-4 w-28" />
        <p className="text-sm text-muted-foreground">Loading user panel...</p>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border bg-muted/40">
              <Lock className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle>User sign-in required</CardTitle>
            <CardDescription>Sign in to access your profile and session controls.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link
              href={loginHref}
              className={cn(buttonVariants({ size: "lg" }), "inline-flex w-full justify-center no-underline")}
            >
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Could not load user panel</CardTitle>
            <CardDescription>
              Please confirm the backend API is running and try again.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Link href="/projects" className={cn(buttonVariants({ variant: "ghost" }), "no-underline")}>
              Console
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-border bg-card/60 px-4 py-6 md:w-56 md:border-b-0 md:border-e">
        <div className="flex items-center justify-between gap-2 md:block">
          <span className="text-sm font-semibold tracking-tight text-foreground">Profile</span>
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 no-underline md:mt-3 md:w-full md:justify-center",
            )}
          >
            Console
          </Link>
        </div>
        <nav className="mt-5 flex flex-row gap-1 overflow-x-auto md:mt-6 md:flex-col" aria-label="Profile">
          {userNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "shrink-0 justify-start gap-2 no-underline md:w-full",
                  active && "bg-muted/80 text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4 opacity-80" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
