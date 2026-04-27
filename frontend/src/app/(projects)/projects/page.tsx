"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getApiBaseUrl, type ProjectRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FolderKanban } from "lucide-react";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/projects`, {
          credentials: "include",
        });
        const json = (await res.json()) as {
          success?: boolean;
          message?: string;
          data?: ProjectRow[];
        };
        if (!res.ok || json.success === false) {
          if (!cancelled) setListError(json.message ?? "Could not load projects.");
          return;
        }
        if (!cancelled) setProjects(json.data ?? []);
      } catch {
        if (!cancelled) setListError("Could not load projects.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (listError) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <span>{listError}</span>
            <Link href="/login" className={cn(buttonVariants(), "w-fit no-underline")}>
              Sign in
            </Link>
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  if (projects === null) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[88px] w-full rounded-xl" />
          <Skeleton className="h-[88px] w-full rounded-xl" />
          <Skeleton className="h-[88px] w-full rounded-xl" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each project can contain multiple OAuth clients.
          </p>
        </div>
        <Link href="/projects/new" className={cn(buttonVariants(), "no-underline")}>
          New project
        </Link>
      </div>

      {!projects.length ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderKanban aria-hidden />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>
              Create a project to register redirect URIs and OAuth clients in one place.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/projects/new" className={cn(buttonVariants(), "no-underline")}>
              Create your first project
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => (
            <li key={p._id}>
              <Link href={`/projects/${p._id}`} className="block no-underline">
                <Card className="transition-colors hover:border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {p.description ? (
                      <CardDescription className="line-clamp-2">
                        {p.description}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {p.isDefault ? "Default · " : null}
                    {p.supportEmail ? p.supportEmail : "No support email"}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
