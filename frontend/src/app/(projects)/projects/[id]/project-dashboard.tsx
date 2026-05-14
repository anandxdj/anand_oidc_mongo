"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { OneTimeCredentialsModal } from "@/components/one-time-credentials-modal";
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clientFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ClientRow = {
  clientId: string;
  clientName: string;
  redirectUris: string[];
  description?: string;
  suspended?: boolean;
};

type ProjectMeta = {
  _id: string;
  name: string;
  description?: string;
  companyName?: string;
  supportEmail?: string;
};

type ApiJson<T> = { success?: boolean; message?: string; data?: T };

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const api = getApiBaseUrl();
  const [project, setProject] = useState<ProjectMeta | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [busy, setBusy] = useState(false);

  const [clientName, setClientName] = useState("");
  const [redirectInput, setRedirectInput] = useState("http://localhost:3000/callback");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showClientFormErrors, setShowClientFormErrors] = useState(false);

  const [credOpen, setCredOpen] = useState(false);
  const [cred, setCred] = useState<{ clientId: string; clientSecret: string } | null>(
    null,
  );

  const nameError = useMemo(() => {
    if (!clientName.trim()) return "Application name is required.";
    return null;
  }, [clientName]);

  const redirectUris = useMemo(
    () =>
      redirectInput
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [redirectInput],
  );

  const redirectError = useMemo(() => {
    if (!redirectUris.length) return "Enter at least one redirect URI (one per line).";
    for (const u of redirectUris) {
      try {
        const x = new URL(u);
        if (x.protocol !== "http:" && x.protocol !== "https:") {
          return "Redirect URIs must use http or https.";
        }
      } catch {
        return "Each redirect URI must be a valid absolute URL.";
      }
    }
    return null;
  }, [redirectUris]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [pr, cl] = await Promise.all([
        clientFetch("/api/projects/${projectId}", {
        }),
        clientFetch("/api/projects/${projectId}/clients", {
        }),
      ]);
      const pj = (await pr.json()) as ApiJson<ProjectMeta>;
      const cj = (await cl.json()) as ApiJson<ClientRow[]>;
      if (!pr.ok || pj.success === false) {
        setLoadError(pj.message ?? "Could not load project.");
        return;
      }
      if (!cl.ok || cj.success === false) {
        setLoadError(cj.message ?? "Could not load clients.");
        return;
      }
      setProject(pj.data ?? null);
      setClients(Array.isArray(cj.data) ? cj.data : []);
    } catch {
      setLoadError("Network error.");
    } finally {
      setBootstrapping(false);
    }
  }, [api, projectId]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setShowClientFormErrors(true);
    if (nameError || redirectError) return;
    setBusy(true);
    try {
      const res = await clientFetch("/api/projects/${projectId}/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          clientName: clientName.trim(),
          redirectUris,
          description: description.trim(),
        }),
      });
      const json = (await res.json()) as ApiJson<
        ClientRow & { clientSecret?: string }
      >;
      if (!res.ok || json.success === false) {
        const msg = json.message ?? "Create failed.";
        setFormError(msg);
        toast.error(msg);
        return;
      }
      toast.success("OAuth client created.");
      const d = json.data;
      if (d?.clientId && d.clientSecret) {
        setCred({ clientId: d.clientId, clientSecret: d.clientSecret });
        setCredOpen(true);
      }
      setClientName("");
      setDescription("");
      setShowClientFormErrors(false);
      await load();
    } catch {
      const msg = "Network error.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const rollSecret = async (clientId: string) => {
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch(
        `${api}/api/projects/${projectId}/clients/${encodeURIComponent(clientId)}/roll-secret`,
      );
      const json = (await res.json()) as ApiJson<{ clientId: string; clientSecret: string }>;
      if (!res.ok || json.success === false) {
        const msg = json.message ?? "Rotate failed.";
        setFormError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Client secret rotated. Copy the new secret from the dialog.");
      if (json.data?.clientSecret) {
        setCred({
          clientId: json.data.clientId,
          clientSecret: json.data.clientSecret,
        });
        setCredOpen(true);
      }
      await load();
    } catch {
      const msg = "Network error.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Alert variant="destructive">
          <AlertTitle>Could not load project</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{loadError}</span>
            <Link
              href="/projects"
              className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-destructive underline-offset-4")}
            >
              Back to projects
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (bootstrapping) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
        <div>
          <Skeleton className="mb-4 h-8 w-28" />
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardContent className="border-t border-border pt-4">
            <Skeleton className="h-9 w-36" />
          </CardContent>
        </Card>
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-4 h-48 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">
      <div>
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-4 -ms-2 inline-flex no-underline",
          )}
        >
          ← All projects
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project?.name ?? "Project"}
        </h1>
        {project?.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add OAuth client</CardTitle>
          <CardDescription>
            Redirect URIs must match exactly what you send on the authorize request.
          </CardDescription>
        </CardHeader>
        <form onSubmit={createClient}>
          <CardContent className="flex flex-col gap-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Action failed</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <FieldGroup>
              <Field data-invalid={showClientFormErrors && !!nameError}>
                <FieldLabel htmlFor="c-name">Application name</FieldLabel>
                <Input
                  id="c-name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  disabled={busy}
                  aria-invalid={showClientFormErrors && !!nameError}
                />
                {showClientFormErrors && nameError ? (
                  <FieldError>{nameError}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={showClientFormErrors && !!redirectError}>
                <FieldLabel htmlFor="c-redirect">Redirect URIs</FieldLabel>
                <textarea
                  id="c-redirect"
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 min-h-24 w-full rounded-xl border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                  value={redirectInput}
                  onChange={(e) => setRedirectInput(e.target.value)}
                  disabled={busy}
                  aria-invalid={showClientFormErrors && !!redirectError}
                />
                <FieldDescription>One URI per line or comma-separated.</FieldDescription>
                {showClientFormErrors && redirectError ? (
                  <FieldError>{redirectError}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="c-desc">Description (optional)</FieldLabel>
                <Input
                  id="c-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={busy}
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardContent className="flex flex-col border-t border-border pt-4">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Create client"}
            </Button>
          </CardContent>
        </form>
      </Card>

      <section>
        <h2 className="text-lg font-medium">Clients</h2>
        <div className="mt-4 rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted/40 [&_tr]:border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Client ID
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
                  Redirects
                </TableHead>
                <TableHead className="px-4 py-3 text-end text-xs font-medium uppercase text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No clients yet. Create one above.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((c) => (
                  <TableRow key={c.clientId}>
                    <TableCell className="px-4 py-3">
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span>{c.clientName}</span>
                        {c.suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs">{c.clientId}</TableCell>
                    <TableCell className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {c.redirectUris.join(", ")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy || c.suspended}
                        onClick={() => rollSecret(c.clientId)}
                      >
                        Rotate secret
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {cred ? (
        <OneTimeCredentialsModal
          open={credOpen}
          clientId={cred.clientId}
          clientSecret={cred.clientSecret}
          onDismiss={() => {
            setCredOpen(false);
            setCred(null);
          }}
        />
      ) : null}
    </main>
  );
}
