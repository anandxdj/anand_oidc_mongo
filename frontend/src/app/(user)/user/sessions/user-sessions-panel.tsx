"use client";

import { useState } from "react";
import { Laptop, Loader2 } from "lucide-react";
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
import { getApiBaseUrl, getAuthHeaders, type ApiJson, type UserSessionRow } from "@/lib/api";

function formatTs(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export function UserSessionsPanel({ initialSessions }: { initialSessions: UserSessionRow[] }) {
  const [sessions, setSessions] = useState<UserSessionRow[]>(initialSessions);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadSessions = async (withLoading = true) => {
    if (withLoading) {
      setLoading(true);
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/sessions`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = (await res.json()) as ApiJson<UserSessionRow[]>;
      if (!res.ok || !json.data) {
        throw new Error(json.message || "Could not load sessions.");
      }
      setSessions(json.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load sessions.");
    } finally {
      if (withLoading) {
        setLoading(false);
      }
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = (await res.json()) as ApiJson<{ id: string }>;
      if (!res.ok || json.success === false) {
        throw new Error(json.message || "Could not revoke session.");
      }
      toast.success("Session revoked.");
      await loadSessions(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke session.");
    } finally {
      setRevokingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Signed-in devices</CardTitle>
          <CardDescription>Loading your active sessions...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" aria-hidden />
          Fetching sessions
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Laptop aria-hidden />
          </EmptyMedia>
          <EmptyTitle>No active sessions</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t find any active session for this account right now.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button type="button" variant="outline" onClick={() => void loadSessions()}>
            Refresh
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed-in devices</CardTitle>
        <CardDescription>Revoke access from devices you no longer trust.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{session.userAgent || "Unknown device"}</p>
                {session.isCurrent ? <Badge>Current</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">IP: {session.ipAddress || "Unavailable"}</p>
              <p className="text-xs text-muted-foreground">Last activity: {formatTs(session.lastSeenAt)}</p>
              <p className="text-xs text-muted-foreground">Signed in: {formatTs(session.createdAt)}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void revokeSession(session.id)}
              disabled={Boolean(session.isCurrent) || revokingId === session.id}
            >
              {revokingId === session.id ? "Revoking..." : "Revoke"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
