"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { clientFetch } from "@/lib/client-api";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type ConsentContext = {
  transaction_id: string;
  client_id: string;
  client_name: string;
  description: string;
  logo_url: string;
  scope: string;
  client_suspended: boolean;
};

function loginReturnTo(): string {
  if (typeof window === "undefined") return "/login";
  const path = `${window.location.pathname}${window.location.search}`;
  return `/login?return_to=${encodeURIComponent(path)}`;
}

export function ConsentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = useMemo(
    () => searchParams.get("transaction_id")?.trim() ?? "",
    [searchParams],
  );

  const [ctx, setCtx] = useState<ConsentContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!transactionId) {
      setError("Missing transaction_id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/oauth/consent/context?transaction_id=${encodeURIComponent(transactionId)}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: ConsentContext;
        message?: string;
      };
      if (res.status === 401) {
        router.replace(loginReturnTo());
        return;
      }
      if (!res.ok || json.success === false) {
        setError(json.message ?? "Could not load consent.");
        setCtx(null);
        return;
      }
      setCtx(json.data ?? null);
    } catch {
      setError("Could not reach the server.");
      setCtx(null);
    } finally {
      setLoading(false);
    }
  }, [router, transactionId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const decide = async (decision: "allow" | "deny") => {
    if (!transactionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await clientFetch("/api/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: transactionId, decision }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { redirect_url?: string };
        message?: string;
      };
      if (res.status === 401) {
        router.replace(loginReturnTo());
        return;
      }
      if (!res.ok || json.success === false) {
        setError(json.message ?? "Consent request failed.");
        return;
      }
      const next = json.data?.redirect_url;
      if (next) {
        window.location.assign(next);
        return;
      }
      setError("No redirect URL returned.");
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  if (!transactionId) {
    return (
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>Open the consent screen from the sign-in flow.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className={cn(buttonVariants(), "no-underline")}>
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-col px-6 py-16">
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-full max-w-xs" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </CardFooter>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Loading authorization request…
        </p>
      </main>
    );
  }

  if (error && !ctx) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
            <Link href="/login" className={cn(buttonVariants(), "no-underline")}>
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </main>
    );
  }

  if (!ctx) return null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-6 py-16">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Authorize {ctx.client_name}</CardTitle>
            {ctx.client_suspended ? (
              <Badge variant="destructive">Suspended</Badge>
            ) : null}
          </div>
          <CardDescription>
            This application is requesting access with the scopes below. Only continue if you
            trust this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {ctx.client_suspended ? (
            <Alert variant="destructive">
              <AlertTitle>Application suspended</AlertTitle>
              <AlertDescription>
                This application has been suspended. You cannot grant access.
              </AlertDescription>
            </Alert>
          ) : null}
          {ctx.description ? (
            <p className="text-muted-foreground">{ctx.description}</p>
          ) : null}
          <div>
            <span className="font-medium text-foreground">Scopes</span>
            <pre className="mt-2 overflow-x-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
              {ctx.scope}
            </pre>
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Could not complete request</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy || ctx.client_suspended}
            onClick={() => void decide("deny")}
          >
            Deny
          </Button>
          <Button
            type="button"
            disabled={busy || ctx.client_suspended}
            onClick={() => void decide("allow")}
          >
            Allow
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
