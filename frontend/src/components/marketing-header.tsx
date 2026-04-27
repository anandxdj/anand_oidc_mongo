import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 flex justify-center px-4 pt-4 pb-2">
      <nav
        className="flex max-w-3xl flex-wrap items-center justify-center gap-1.5 rounded-full border border-border bg-card/85 px-2 py-2 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-card/70"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="me-1 shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold tracking-tight text-foreground no-underline"
        >
          OIDC
        </Link>
        <span
          className="hidden h-5 w-px shrink-0 bg-border sm:block"
          aria-hidden
        />
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-full px-3 no-underline",
          )}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "rounded-full px-3 no-underline",
          )}
        >
          Create account
        </Link>
      </nav>
    </header>
  );
}
