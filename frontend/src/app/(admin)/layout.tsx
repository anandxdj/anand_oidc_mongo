"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<"loading" | "ok" | "forbidden">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setState("forbidden");
          return;
        }
        const json = (await res.json()) as {
          success?: boolean;
          data?: { role?: string };
        };
        if (json.data?.role === "admin") {
          if (!cancelled) setState("ok");
        } else if (!cancelled) {
          setState("forbidden");
        }
      } catch {
        if (!cancelled) setState("forbidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page could not be found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border bg-card/70 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="text-sm font-medium text-muted-foreground">Admin</span>
          <Link
            href="/projects"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "no-underline")}
          >
            Back to console
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
