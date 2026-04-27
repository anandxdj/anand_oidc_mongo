import { Suspense } from "react";

import { ConsentClient } from "./consent-client";

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex max-w-md flex-col px-6 py-16">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <ConsentClient />
    </Suspense>
  );
}
