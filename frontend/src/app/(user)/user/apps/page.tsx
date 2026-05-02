import { type UserAuthorizedAppRow } from "@/lib/api";
import { fetchApi } from "@/lib/server-api";
import { UserAuthorizedAppsPanel } from "./user-authorized-apps-panel";

export const metadata = {
  title: "Authorized Apps",
};

export default async function UserAuthorizedAppsPage() {
  let initialApps: UserAuthorizedAppRow[] = [];
  try {
    const res = await fetchApi("/api/auth/authorized-apps");
    if (res.ok) {
      const json = (await res.json()) as { data?: UserAuthorizedAppRow[] };
      initialApps = json.data || [];
    }
  } catch {
    initialApps = [];
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Authorized apps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review OAuth consents and revoke app access to your account at any time.
        </p>
      </div>
      <UserAuthorizedAppsPanel initialApps={initialApps} />
    </main>
  );
}
