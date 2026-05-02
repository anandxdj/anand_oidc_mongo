import { type UserSessionRow } from "@/lib/api";
import { fetchApi } from "@/lib/server-api";
import { UserSessionsPanel } from "./user-sessions-panel";

export const metadata = {
  title: "User Sessions",
};

export default async function UserSessionsPage() {
  let initialSessions: UserSessionRow[] = [];
  try {
    const res = await fetchApi("/api/auth/sessions");
    if (res.ok) {
      const json = (await res.json()) as { data?: UserSessionRow[] };
      initialSessions = json.data || [];
    }
  } catch {
    initialSessions = [];
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Active sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See where you are logged in and revoke any device instantly.
        </p>
      </div>
      <UserSessionsPanel initialSessions={initialSessions} />
    </main>
  );
}
