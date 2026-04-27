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
import { cn } from "@/lib/utils";

type Props = {
  searchParams: Promise<{ error?: string; error_description?: string; state?: string }>;
};

export default async function OAuthErrorPage({ searchParams }: Props) {
  const q = await searchParams;
  const code = q.error ?? "unknown_error";
  const desc =
    q.error_description ??
    "The authorization server could not complete the request. Try signing in again, or contact the app developer.";

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle>We couldn&apos;t finish signing you in</CardTitle>
          <CardDescription>
            The application sent you back here with an OAuth or OpenID Connect error.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Error</span>
            <p className="mt-1 font-mono text-xs text-foreground">{code}</p>
          </div>
          <p className="leading-relaxed text-muted-foreground">{desc}</p>
          {q.state ? (
            <details className="rounded-xl border border-border bg-muted/30 p-3">
              <summary className="cursor-pointer text-xs font-medium text-foreground">
                Technical details
              </summary>
              <pre className="mt-3 overflow-x-auto font-mono text-[11px] text-muted-foreground">
                {JSON.stringify({ error: code, error_description: desc, state: q.state }, null, 2)}
              </pre>
            </details>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Link href="/login" className={cn(buttonVariants(), "no-underline")}>
            Sign in again
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "no-underline")}>
            Home
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
