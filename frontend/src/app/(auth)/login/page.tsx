import { Suspense } from "react";

import { LoginForm } from "./login-form";

function LoginFormFallback() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
