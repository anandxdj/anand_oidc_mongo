import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-10 px-6 py-20">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Identity for your applications
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sign in to manage projects and OAuth clients, run authorization flows,
          and connect your apps with OpenID Connect.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ size: "lg" }),
              "min-w-[10rem] no-underline",
            )}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-w-[10rem] no-underline",
            )}
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
