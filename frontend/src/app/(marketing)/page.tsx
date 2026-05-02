import Link from "next/link";

import { MarketingTopBar } from "@/components/marketing-top-bar";
import TextFlippingBoardDemo from "@/components/text-flipping-board-demo";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Highlight } from "@/components/ui/hero-highlight";
import { cn } from "@/lib/utils";

const CAPABILITIES = [
  {
    title: "OIDC discovery & JWKS",
    description:
      "Express serves OIDC under /oauth/* with discovery documents and rotating keys so clients wire up without guesswork.",
  },
  {
    title: "Consent flows",
    description:
      "Next.js redirects plus GET /api/oauth/consent/context and POST /api/oauth/consent with transaction_id keep approvals explicit.",
  },
  {
    title: "Admin APIs & projects",
    description:
      "Role-based admin under /api/admin/*; OAuth clients live under /api/projects and per-project client routes.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <section className="flex flex-1 flex-col px-6 pb-12 pt-6 sm:pb-16">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          <MarketingTopBar />
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center sm:py-12">
            <h1 className="font-heading max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Ship{" "}
              <Highlight className="text-foreground dark:text-foreground">
                OIDC
              </Highlight>{" "}
              without wrestling the spec.
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Projects, OAuth clients, consent, and tokens—so your apps can sign
              users in with standards you can trust.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-w-40 no-underline",
                )}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-w-40 no-underline",
                )}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="capabilities-heading"
        className="border-t border-foreground/10 bg-linear-to-b from-muted/30 to-background px-6 py-16 sm:py-20"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <h2
              id="capabilities-heading"
              className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              Why this stack
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Standards-first identity with a clear split between the API
              surface and your product UI.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {CAPABILITIES.map((item) => (
              <Card
                key={item.title}
                size="sm"
                className="border-foreground/10 bg-card/80 shadow-none ring-foreground/15 dark:bg-zinc-950/60 dark:ring-white/10"
              >
                <CardHeader className="pb-2">
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs leading-relaxed sm:text-sm">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-label="Rotating highlights"
        className="border-t border-foreground/10 px-6 py-16 sm:py-24"
      >
        <div className="mx-auto w-full max-w-5xl">
          <TextFlippingBoardDemo />
        </div>
      </section>

      <section
        aria-labelledby="cta-heading"
        className="border-t border-foreground/10 bg-muted/25 px-6 py-12 sm:py-14 dark:bg-zinc-950/40"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 text-center">
          <h2
            id="cta-heading"
            className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
          >
            Ready to wire your first client?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Create a project, register redirect URIs, and exercise the consent
            screen against a real issuer.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-w-40 no-underline",
              )}
            >
              Create account
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-w-40 no-underline",
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
