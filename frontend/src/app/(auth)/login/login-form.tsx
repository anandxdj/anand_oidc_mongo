"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { getApiBaseUrl, uiSessionCookieValue } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Only allow redirect back to the OIDC server (same origin as API), on /oauth paths. */
function safeOAuthReturnTo(raw: string | null, apiBase: string): string | null {
  if (!raw?.trim()) return null;
  const decoded = (() => {
    try {
      return decodeURIComponent(raw.trim());
    } catch {
      return null;
    }
  })();
  if (!decoded) return null;

  let url: URL;
  try {
    url = new URL(decoded);
  } catch {
    return null;
  }

  let apiOrigin: string;
  try {
    apiOrigin = new URL(apiBase).origin;
  } catch {
    return null;
  }

  if (url.origin !== apiOrigin) return null;
  if (!url.pathname.startsWith("/oauth/")) return null;
  return url.toString();
}

/** Same-origin app paths (e.g. after middleware return_to). */
function safeAppReturnTo(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  const blocked = ["/login", "/register", "/verify-email", "/consent", "/error"];
  for (const b of blocked) {
    if (decoded === b || decoded.startsWith(`${b}/`)) return null;
  }
  if (typeof window === "undefined") return null;
  return `${window.location.origin}${decoded}`;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToRaw = searchParams.get("return_to");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const emailError = useMemo(() => {
    if (!email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Enter a valid email address.";
    }
    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "Password is required.";
    return null;
  }, [password]);

  const canSubmit = !emailError && !passwordError;
  const showFieldErrors = submitAttempted;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitAttempted(true);
    if (!canSubmit) return;

    setLoading(true);
    const apiBase = getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
      };
      if (!res.ok || json.success === false) {
        setFormError(json.message ?? "Sign in failed.");
        return;
      }

      document.cookie = uiSessionCookieValue();

      const oauthNext = safeOAuthReturnTo(returnToRaw, apiBase);
      if (oauthNext) {
        window.location.assign(oauthNext);
        return;
      }
      const appNext = safeAppReturnTo(returnToRaw);
      if (appNext) {
        window.location.assign(appNext);
        return;
      }
      router.push("/projects");
      router.refresh();
    } catch {
      setFormError(
        "Could not reach the server. Is the API running and NEXT_PUBLIC_API_URL set?",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your verified account. For OIDC flows, you may arrive here with a{" "}
          <code className="rounded-full bg-muted px-2 py-0.5 text-xs">return_to</code> link back
          to authorize on the API host.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            {formError ? (
              <Field>
                <FieldError>{formError}</FieldError>
              </Field>
            ) : null}
            <Field data-invalid={showFieldErrors && !!emailError}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-invalid={showFieldErrors && !!emailError}
              />
              {showFieldErrors && emailError ? (
                <FieldError>{emailError}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={showFieldErrors && !!passwordError}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <Input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={showFieldErrors && !!passwordError}
              />
              {showFieldErrors && passwordError ? (
                <FieldError>{passwordError}</FieldError>
              ) : (
                <FieldDescription>
                  Use the password you chose when you created your account.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "inline-flex text-center no-underline",
            )}
          >
            Create an account
          </Link>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex text-center no-underline",
              )}
            >
              Home
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
