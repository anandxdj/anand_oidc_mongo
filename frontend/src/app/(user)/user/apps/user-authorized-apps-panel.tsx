"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { clientFetch } from "@/lib/client-api";

function formatTs(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function normalizeScopes(scope?: string): string {
  return (scope || "openid")
    .split(/\s+/)
    .filter(Boolean)
    .join(", ");
}

export function UserAuthorizedAppsPanel({ initialApps }: { initialApps: UserAuthorizedAppRow[] }) {
  const [apps, setApps] = useState<UserAuthorizedAppRow[]>(initialApps);
  const [loading, setLoading] = useState(false);
  const [revokingClientId, setRevokingClientId] = useState<string | null>(null);

  const loadApps = async (withLoading = true) => {
    if (withLoading) setLoading(true);
    try {
      const res = await clientFetch("/api/auth/authorized-apps", {
      });
      const json = (await res.json()) as ApiJson<UserAuthorizedAppRow[]>;
      if (!res.ok || !json.data) {
        throw new Error(json.message || "Could not load authorized apps.");
      }
      setApps(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load authorized apps.");
    } finally {
      if (withLoading) setLoading(false);
    }
  };

  const revokeApp = async (clientId: string) => {
    setRevokingClientId(clientId);
    try {
      const res = await clientFetch("/api/auth/authorized-apps/${encodeURIComponent(clientId)}", {
        method: "DELETE",
      });
      const json = (await res.json()) as ApiJson<{ revoked: boolean; clientId: string }>;
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not revoke app access.");
      }
      toast.success("App access revoked.");
      await loadApps(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke app access.");
    } finally {
      setRevokingClientId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected apps</CardTitle>
          <CardDescription>Loading apps that currently have consent...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" aria-hidden />
          Fetching authorized apps
        </CardContent>
      </Card>
    );
  }

  if (apps.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyRound aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No authorized apps</EmptyTitle>
          <EmptyDescription>
            You have not granted OAuth consent to any application yet.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" variant="outline" onClick={() => void loadApps()}>
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected apps</CardTitle>
        <CardDescription>Revoke consent for any app you no longer trust.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {apps.map((app) => (
          <div
            key={app.clientId}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{app.clientName || app.clientId}</p>
                {app.clientSuspended ? <Badge variant="destructive">Suspended</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">Client ID: {app.clientId}</p>
              <p className="text-xs text-muted-foreground">Scopes: {normalizeScopes(app.scope)}</p>
              <p className="text-xs text-muted-foreground">Granted: {formatTs(app.grantedAt)}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void revokeApp(app.clientId)}
              disabled={revokingClientId === app.clientId}
            >
              {revokingClientId === app.clientId ? "Revoking..." : "Revoke access"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
