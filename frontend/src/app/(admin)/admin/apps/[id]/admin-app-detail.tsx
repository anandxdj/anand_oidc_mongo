"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminOAuthClientRow,
  type ApiJson,
  getApiBaseUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

import { clientFetch } from "@/lib/client-api";

function formatTs(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminAppDetail() {
  const params = useParams();
  const rawId = typeof params.id === "string" ? params.id : "";
  const clientId = rawId ? decodeURIComponent(rawId) : "";

  const api = getApiBaseUrl();
  const [row, setRow] = useState<AdminOAuthClientRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendBusy, setSuspendBusy] = useState(false);

  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [unsuspendBusy, setUnsuspendBusy] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoadError(null);
    try {
      const res = await clientFetch(`/api/admin/apps/${encodeURIComponent(clientId)}`, {
      });
      const json = (await res.json()) as ApiJson<AdminOAuthClientRow>;
      if (!res.ok || json.success === false) {
        setLoadError(json.message ?? "Could not load client.");
        setRow(null);
        return;
      }
      setRow(json.data ?? null);
    } catch {
      setLoadError("Could not load client.");
      setRow(null);
    } finally {
      setBooting(false);
    }
  }, [clientId]);

  useEffect(() => {
    setBooting(true);
    void load();
  }, [load]);

  const suspended = Boolean(row?.suspended);

  async function submitSuspend() {
    if (!row) return;
    const reason = suspendReason.trim();
    if (!reason) {
      toast.error("Enter a suspension reason.");
      return;
    }
    setSuspendBusy(true);
    try {
      const res = await clientFetch(`/api/admin/apps/${encodeURIComponent(row.clientId)}`, {
        method: "PATCH",
        body: JSON.stringify({ suspended: true, suspendedReason: reason }),
      });
      const json = (await res.json()) as ApiJson<AdminOAuthClientRow>;
      if (!res.ok || json.success === false) {
        toast.error(json.message ?? "Could not suspend client.");
        return;
      }
      toast.success("Client suspended.");
      setSuspendOpen(false);
      setSuspendReason("");
      await load();
    } catch {
      toast.error("Could not suspend client.");
    } finally {
      setSuspendBusy(false);
    }
  }

  async function submitUnsuspend() {
    if (!row) return;
    setUnsuspendBusy(true);
    try {
      const res = await clientFetch(`/api/admin/apps/${encodeURIComponent(row.clientId)}`, {
        method: "PATCH",
        body: JSON.stringify({ suspended: false }),
      });
      const json = (await res.json()) as ApiJson<AdminOAuthClientRow>;
      if (!res.ok || json.success === false) {
        toast.error(json.message ?? "Could not restore client.");
        return;
      }
      toast.success("Client restored.");
      setUnsuspendOpen(false);
      await load();
    } catch {
      toast.error("Could not restore client.");
    } finally {
      setUnsuspendBusy(false);
    }
  }

  if (!clientId) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Alert variant="destructive">
          <AlertTitle>Invalid client</AlertTitle>
          <AlertDescription>Missing client id in the URL.</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (booting) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </main>
    );
  }

  if (loadError || !row) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <Link
          href="/admin/apps"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit gap-1 no-underline",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden />
          All applications
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {loadError ?? "Client not found."}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/admin/apps"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-2 w-fit gap-1 px-0 no-underline",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            All applications
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {row.clientName}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {row.clientId}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant={suspended ? "destructive" : "secondary"}>
            {suspended ? "Suspended" : "Active"}
          </Badge>
          {suspended ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnsuspendOpen(true)}
            >
              Restore client
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setSuspendOpen(true)}
            >
              Suspend client
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Redirect URIs</CardTitle>
          <CardDescription>
            Registered callback URLs for this client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
            {row.redirectUris?.length ? (
              row.redirectUris.map((u) => (
                <li
                  key={u}
                  className="break-all rounded-md border border-border/60 bg-muted/30 px-3 py-2"
                >
                  {u}
                </li>
              ))
            ) : (
              <li>—</li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-1 whitespace-pre-wrap text-foreground/90">
              {row.description?.trim() ? row.description : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Owner
            </p>
            <p className="mt-1 text-foreground/90">
              {row.ownerId?.name ?? "—"}
            </p>
            <p className="text-muted-foreground">{row.ownerId?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project
            </p>
            <p className="mt-1 text-foreground/90">
              {row.projectId?.name ?? "—"}
            </p>
            {row.projectId?.isDefault ? (
              <p className="text-xs text-muted-foreground">Default project</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suspension
            </p>
            <p className="mt-1 text-foreground/90">
              {formatTs(row.suspendedAt)}
            </p>
            {row.suspendedReason ? (
              <p className="mt-2 whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-2 text-xs text-muted-foreground">
                {row.suspendedReason}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Created
            </p>
            <p className="mt-1 text-foreground/90">{formatTs(row.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Updated
            </p>
            <p className="mt-1 text-foreground/90">{formatTs(row.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Suspend client</DialogTitle>
            <DialogDescription>
              Users will be blocked from completing new authorizations for this
              application. Provide an internal reason (required).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension…"
            rows={4}
            className="resize-none"
          />
          <DialogFooter showCloseButton={false}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSuspendOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={suspendBusy}
              onClick={submitSuspend}
            >
              {suspendBusy ? "Saving…" : "Confirm suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unsuspendOpen} onOpenChange={setUnsuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this client?</AlertDialogTitle>
            <AlertDialogDescription>
              Suspension will be cleared and the client may accept new
              authorizations again (subject to your policies).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unsuspendBusy}>
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={unsuspendBusy}
              onClick={() => void submitUnsuspend()}
            >
              {unsuspendBusy ? "Restoring…" : "Restore client"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
