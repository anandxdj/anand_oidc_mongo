"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type AdminStats,
  type ApiJson,
  getApiBaseUrl,
  getAuthHeaders,
} from "@/lib/api";
import { KeyRound, Radio, Users, Boxes } from "lucide-react";

export default function AdminOverviewPage() {
  const api = getApiBaseUrl();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await clientFetch("/api/admin/stats", {
        });
        const json = (await res.json()) as ApiJson<AdminStats>;
        if (!res.ok || json.success === false) {
          if (!cancelled)
            setError(json.message ?? "Could not load admin stats.");
          return;
        }
        if (json.data && !cancelled) setStats(json.data);
        else if (!cancelled) setError("Unexpected response.");
      } catch {
        if (!cancelled) setError("Could not load admin stats.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide metrics for users, OAuth clients, and token activity.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/80 bg-card/50">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  const cards = [
    {
      title: "Users",
      value: stats.totalUsers,
      icon: Users,
      hint: "Registered accounts",
    },
    {
      title: "OAuth clients",
      value: stats.totalOAuthClients,
      icon: Boxes,
      hint: "Across all projects",
    },
    {
      title: "Auth codes (today)",
      value: stats.authCodesIssuedToday,
      icon: KeyRound,
      hint: "UTC day, audit trail",
    },
    {
      title: "Active access tokens",
      value: stats.activeAccessTokensApprox,
      icon: Radio,
      hint: "Approximate, not expired",
    },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide metrics for users, OAuth clients, and token activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card
              key={c.title}
              className="border-border/80 bg-card/50 shadow-sm transition-colors hover:border-primary/25"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {c.title}
                </CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
                  <Icon className="size-4 text-foreground/80" aria-hidden />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {c.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
