import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile",
};

export default async function SettingsPage() {
  redirect("/user/profile");
}
