"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientFetch } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { UserProfileForm } from "./user-profile-form";

export default function UserProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [state, setState] = useState<"loading" | "error" | "unauthenticated">("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await clientFetch("/api/auth/me", {
        });
        const json = (await res.json()) as ApiJson<UserProfile>;

        if (res.status === 401 || res.status === 403) {
          if (!cancelled) setState("unauthenticated");
          return;
        }

        if (!res.ok || !json.data) {
          if (!cancelled) setState("error");
          return;
        }

        if (!cancelled) {
          setUser(json.data);
          setState("loading");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (user) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10 lg:py-12">
        <UserProfileForm user={user} />
      </main>
    );
  }

  if (state === "unauthenticated") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Session expired</CardTitle>
            <CardDescription>Sign in again to access your profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link
              href={`/login?return_to=${encodeURIComponent("/user/profile")}`}
              className={cn(buttonVariants({ size: "lg" }), "w-full justify-center no-underline")}
            >
              Sign in
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Could not load profile</CardTitle>
            <CardDescription>Please confirm the backend API is running and try again.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[40vh] items-center justify-center gap-2 px-6 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      Loading profile...
    </main>
  );
}
