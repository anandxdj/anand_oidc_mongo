import { redirect } from "next/navigation";

import { type UserProfile } from "@/lib/api";
import { fetchApi } from "@/lib/server-api";
import { UserProfileForm } from "./user-profile-form";

export const metadata = {
  title: "Profile",
};

export default async function UserProfilePage() {
  const res = await fetchApi("/api/auth/me");
  if (!res.ok) {
    redirect("/login?return_to=" + encodeURIComponent("/user/profile"));
  }

  const json = (await res.json()) as { data?: UserProfile };
  const user = json.data;
  if (!user) {
    redirect("/login?return_to=" + encodeURIComponent("/user/profile"));
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col px-6 py-10 lg:py-12">
      <UserProfileForm user={user} />
    </main>
  );
}
