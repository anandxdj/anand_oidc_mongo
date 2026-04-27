export function MarketingFooter() {
  return (
    <footer className="mt-auto border-t border-foreground/10 bg-muted/20 px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 text-center">
        <p className="font-heading text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Identity stack
        </p>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          OpenID Connect provider for projects and OAuth clients—discovery,
          tokens, and admin tooling in one place.
        </p>
      </div>
    </footer>
  );
}
