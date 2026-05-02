"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Lock, ShieldOff } from "lucide-react";

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

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<
    "loading" | "ok" | "unauthenticated" | "not_superadmin" | "error"
  >("loading");

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
        if (json.data?.role === "superadmin") {
          if (!cancelled) setState("ok");
        } else if (!cancelled) {
          setState("not_superadmin");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const returnTo =
    pathname && pathname.startsWith("/superadmin")
      ? encodeURIComponent(pathname)
      : encodeURIComponent("/superadmin");
  const loginHref = `/login?return_to=${returnTo}`;

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6">
        <Skeleton className="h-4 w-28" />
        <p className="text-sm text-muted-foreground">Verifying super admin access...</p>
      </div>
    );
  }

  if (state === "unauthenticated") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border bg-muted/40">
              <Lock className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle>Super admin sign-in required</CardTitle>
            <CardDescription>
              Sign in with a <span className="font-medium text-foreground">superadmin</span>{" "}
              account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href={loginHref} className={cn(buttonVariants({ size: "lg" }), "no-underline")}>
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "not_superadmin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full border bg-muted/40">
              <ShieldOff className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle>Super admin access only</CardTitle>
            <CardDescription>
              Admin users cannot open this panel. This area is restricted to superadmin only.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-2">
            <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "no-underline")}>
              Go to admin
            </Link>
            <Link href="/projects" className={cn(buttonVariants({ variant: "ghost" }), "no-underline")}>
              Console
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Could not verify access</CardTitle>
            <CardDescription>
              Confirm the API is running and try opening the panel again.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-foreground/80" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Super Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")}>
            Admin
          </Link>
          <Link href="/projects" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-underline")}>
            Console
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
