"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
import { LayoutDashboard, Lock, Shield, ShieldOff, Users } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/apps", label: "Applications", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<
    "loading" | "ok" | "unauthenticated" | "not_admin" | "error"
  >("loading");
  const [role, setRole] = useState<string>("");

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
        const json = (await res.json()) as {
          success?: boolean;
          data?: { role?: string };
        };
        if (json.data?.role === "admin" || json.data?.role === "superadmin") {
          if (!cancelled) setRole(json.data?.role || "");
          if (!cancelled) setState("ok");
        } else if (!cancelled) {
          setState("not_admin");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="relative flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(255,255,255,0.05),transparent)]" />
        <Skeleton className="h-4 w-28" />
        <p className="text-sm text-muted-foreground">Verifying access…</p>
      </div>
    );
  }

  const returnTo =
    pathname && pathname.startsWith("/admin")
      ? encodeURIComponent(pathname)
      : encodeURIComponent("/admin");
  const loginHref = `/login?return_to=${returnTo}`;

  if (state === "unauthenticated") {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,255,255,0.06),transparent)]"
          aria-hidden
        />
        <Card className="relative z-10 w-full max-w-md border-border/80 bg-card/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-border/80 bg-muted/40">
              <Lock className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle className="text-xl tracking-tight">Administrator sign-in</CardTitle>
            <CardDescription className="text-pretty">
              This area is restricted. Sign in with an account that has the{" "}
              <span className="font-medium text-foreground">admin</span> or{" "}
              <span className="font-medium text-foreground">superadmin</span> role to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link
              href={loginHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "inline-flex w-full items-center justify-center no-underline sm:w-auto",
              )}
            >
              Sign in as admin
            </Link>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/60 pt-6">
            <Link
              href="/projects"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-underline")}
            >
              Back to console
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === "not_admin") {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,255,255,0.06),transparent)]"
          aria-hidden
        />
        <Card className="relative z-10 w-full max-w-md border-border/80 bg-card/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-border/80 bg-muted/40">
              <ShieldOff className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle className="text-xl tracking-tight">Administrator access required</CardTitle>
            <CardDescription className="text-pretty">
              You&apos;re signed in, but this account does not have administrator privileges. Ask an
              owner to grant the <span className="font-medium text-foreground">admin</span> or{" "}
              <span className="font-medium text-foreground">superadmin</span> role on your user
              record.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex w-full items-center justify-center no-underline sm:w-auto",
              )}
            >
              Go to console
            </Link>
            <Link
              href={loginHref}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex w-full items-center justify-center no-underline sm:w-auto",
              )}
            >
              Use a different account
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,rgba(255,255,255,0.06),transparent)]"
          aria-hidden
        />
        <Card className="relative z-10 w-full max-w-md border-border/80 bg-card/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border border-border/80 bg-muted/40">
              <Shield className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle className="text-xl tracking-tight">Could not verify access</CardTitle>
            <CardDescription className="text-pretty">
              We couldn&apos;t reach the API or complete the check. Confirm the backend is running
              and <code className="text-xs">NEXT_PUBLIC_API_URL</code> points at it, then try again.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Link
              href="/projects"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex items-center justify-center no-underline",
              )}
            >
              Console
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full flex-col md:flex-row">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.07),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-background to-background" aria-hidden />

      <aside className="relative z-10 border-b border-border/80 bg-card/40 px-4 py-6 backdrop-blur-sm md:w-56 md:border-b-0 md:border-e md:border-border/80">
        <div className="flex items-center justify-between gap-2 md:block">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            {role === "superadmin" ? "Admin (Superadmin)" : "Admin"}
          </span>
          <Link
            href="/projects"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 no-underline md:mt-3 md:w-full md:justify-center",
            )}
          >
            Back to console
          </Link>
        </div>
        <nav className="mt-5 flex flex-row gap-1 overflow-x-auto md:mt-6 md:flex-col" aria-label="Admin">
          {adminNav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
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

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
