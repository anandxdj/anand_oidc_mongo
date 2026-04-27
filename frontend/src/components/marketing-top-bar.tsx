import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingTopBar() {
  return (
    <header className="mb-10 flex w-full max-w-5xl items-center justify-between gap-4 self-center">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight text-foreground no-underline"
      >
        OIDC
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "no-underline",
          )}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ size: "sm" }), "no-underline")}
        >
          Create account
        </Link>
      </div>
    </header>
  );
}
