import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clientFetch } from "@/lib/client-api";
import { getApiBaseUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ token: string }> };

export default async function VerifyEmailPage({ params }: Props) {
  const { token } = await params;
  const trimmed = String(token ?? "").trim();

  let message = "We could not verify your email.";
  let ok = false;

  if (!trimmed) {
    message = "This verification link is missing a token.";
  } else {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/auth/verify-email/${encodeURIComponent(trimmed)}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as {
        success?: boolean;
        message?: string;
      };
      ok = res.ok && json.success !== false;
      message = json.message ?? (ok ? "Email verified successfully." : message);
    } catch {
      message =
        "Could not reach the server. Is the API running and NEXT_PUBLIC_API_URL set?";
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <Card className={ok ? "border-primary/20" : undefined}>
        <CardHeader>
          <CardTitle>{ok ? "Email verified" : "Verification failed"}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {ok ? (
            <p className="text-sm text-muted-foreground">
              You can sign in with your email and password.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Request a new link by registering again if your account is not yet
              verified, or contact support if the problem continues.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex text-center no-underline",
            )}
          >
            Go to login
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex text-center no-underline",
            )}
          >
            Home
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
