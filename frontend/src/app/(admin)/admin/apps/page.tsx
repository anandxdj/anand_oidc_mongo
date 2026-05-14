"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AdminOAuthClientRow,
  type ApiJson,
  getApiBaseUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

import { clientFetch } from "@/lib/client-api";

export default function AdminAppsPage() {
  const api = getApiBaseUrl();
  const [rows, setRows] = useState<AdminOAuthClientRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await clientFetch(`/api/admin/apps`, {
        });
        const json = (await res.json()) as ApiJson<AdminOAuthClientRow[]>;
        if (!res.ok || json.success === false) {
          if (!cancelled)
            setError(json.message ?? "Could not load applications.");
          return;
        }
        if (!cancelled) setRows(json.data ?? []);
      } catch {
        if (!cancelled) setError("Could not load applications.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All OAuth clients registered on the platform.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (rows === null) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="rounded-xl border border-border/80 bg-card/40 p-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All OAuth clients registered on the platform. Open a row for
          suspension controls.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead className="hidden lg:table-cell">Client ID</TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead className="hidden xl:table-cell">Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10 text-end" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rows.length ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No OAuth clients yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const href = `/admin/apps/${encodeURIComponent(r.clientId)}`;
                const suspended = Boolean(r.suspended);
                return (
                  <TableRow
                    key={r.clientId}
                    className="border-border/60 cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={href}
                        className="text-foreground no-underline hover:underline"
                      >
                        {r.clientName}
                      </Link>
                      <div className="mt-1 font-mono text-xs text-muted-foreground lg:hidden">
                        {r.clientId}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate font-mono text-xs text-muted-foreground lg:table-cell">
                      <Link
                        href={href}
                        className="no-underline hover:underline"
                      >
                        {r.clientId}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                      {r.ownerId?.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                      {r.projectId?.name ?? "—"}
                      {r.projectId?.isDefault ? (
                        <span className="ml-1 text-xs text-muted-foreground/70">
                          · default
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={suspended ? "destructive" : "secondary"}>
                        {suspended ? "Suspended" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <Link
                        href={href}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                          "no-underline",
                        )}
                        aria-label={`Open ${r.clientName}`}
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
