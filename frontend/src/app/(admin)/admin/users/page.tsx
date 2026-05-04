"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AdminAuthorizedApp,
  type AdminAuthorizedAppsResponse,
  type AdminUserRow,
  type AdminUsersPageResponse,
  type ApiJson,
  getApiBaseUrl,
  getAuthHeaders,
} from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

function formatTs(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminUsersPage() {
  const api = getApiBaseUrl();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminUsersPageResponse | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetUser, setSheetUser] = useState<AdminUserRow | null>(null);
  const [appsPayload, setAppsPayload] =
    useState<AdminAuthorizedAppsResponse | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appsLoading, setAppsLoading] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<AdminAuthorizedApp | null>(
    null,
  );
  const [revokeBusy, setRevokeBusy] = useState(false);

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`${api}/api/admin/users?${qs}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = (await res.json()) as ApiJson<AdminUsersPageResponse>;
      if (!res.ok || json.success === false) {
        setListError(json.message ?? "Could not load users.");
        setData(null);
        return;
      }
      setData(json.data ?? null);
    } catch {
      setListError("Could not load users.");
      setData(null);
    } finally {
      setListLoading(false);
    }
  }, [api, page]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const loadApps = useCallback(
    async (userId: string) => {
      setAppsLoading(true);
      setAppsError(null);
      setAppsPayload(null);
      try {
        const res = await fetch(
          `${api}/api/admin/users/${userId}/authorized-apps`,
          {
            credentials: "include",
            headers: getAuthHeaders(),
          },
        );
        const json = (await res.json()) as ApiJson<AdminAuthorizedAppsResponse>;
        if (!res.ok || json.success === false) {
          setAppsError(json.message ?? "Could not load authorized apps.");
          return;
        }
        setAppsPayload(json.data ?? null);
      } catch {
        setAppsError("Could not load authorized apps.");
      } finally {
        setAppsLoading(false);
      }
    },
    [api],
  );

  function openSheet(user: AdminUserRow) {
    setSheetUser(user);
    setSheetOpen(true);
    void loadApps(user._id);
  }

  function onSheetOpenChange(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setSheetUser(null);
      setAppsPayload(null);
      setAppsError(null);
      setRevokeTarget(null);
    }
  }

  async function confirmRevoke() {
    if (!sheetUser || !revokeTarget) return;
    setRevokeBusy(true);
    try {
      const res = await fetch(
        `${api}/api/admin/users/${sheetUser._id}/consents/${encodeURIComponent(revokeTarget.clientId)}`,
        { method: "DELETE", credentials: "include", headers: getAuthHeaders() },
      );
      const json = (await res.json()) as ApiJson<unknown>;
      if (!res.ok || json.success === false) {
        toast.error(json.message ?? "Could not revoke consent.");
        return;
      }
      toast.success("Consent revoked for this application.");
      setRevokeTarget(null);
      await loadApps(sheetUser._id);
    } catch {
      toast.error("Could not revoke consent.");
    } finally {
      setRevokeBusy(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  if (listError && !data) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse accounts and manage authorized applications.
          </p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse accounts and manage authorized applications.
          </p>
        </div>
        {data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">
              Page {data.page} of {totalPages}
            </span>
            <span className="text-border">·</span>
            <span className="tabular-nums">
              {data.total.toLocaleString()} users
            </span>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/40 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/80 hover:bg-transparent">
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listLoading || !data ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="text-end">
                    <Skeleton className="ml-auto h-8 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : !data.items.length ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((u) => (
                <TableRow key={u._id} className="border-border/60">
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {u.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{u.role ?? "user"}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatTs(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openSheet(u)}
                    >
                      Authorized apps
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || listLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages || listLoading}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border/80 p-4 text-left">
            <SheetTitle>Authorized apps</SheetTitle>
            <SheetDescription>
              {sheetUser ? (
                <>
                  Consents for{" "}
                  <span className="font-medium text-foreground">
                    {sheetUser.email}
                  </span>
                </>
              ) : (
                "Select a user from the table."
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {appsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : appsError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{appsError}</AlertDescription>
              </Alert>
            ) : appsPayload && !appsPayload.apps.length ? (
              <p className="text-sm text-muted-foreground">
                No authorized applications for this user.
              </p>
            ) : appsPayload ? (
              <ul className="flex flex-col gap-3">
                {appsPayload.apps.map((app) => (
                  <li
                    key={app.clientId}
                    className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {app.clientName ?? app.clientId}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {app.clientId}
                        </p>
                      </div>
                      {app.clientSuspended ? (
                        <Badge variant="destructive" className="shrink-0">
                          Client suspended
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        Scope:
                      </span>{" "}
                      {app.scope?.trim() ? app.scope : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Granted {formatTs(app.grantedAt)}
                    </p>
                    <div className="pt-1">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeTarget(app)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(o) => !o && setRevokeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke access?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the user&apos;s consent and deletes outstanding
              access tokens for{" "}
              <span className="font-medium text-foreground">
                {revokeTarget?.clientName ?? revokeTarget?.clientId}
              </span>
              . The user can authorize again later if the client is still
              trusted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeBusy}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={revokeBusy}
              onClick={() => void confirmRevoke()}
            >
              {revokeBusy ? "Revoking…" : "Revoke"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
