import { MarketingFloatingNav } from "@/components/marketing-floating-nav";
import { MarketingFooter } from "@/components/marketing-footer";
import { fetchApi } from "@/lib/server-api";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showAdminDashboard = false;
  try {
    const res = await fetchApi("/api/auth/me");
    if (res.ok) {
      const json = (await res.json()) as { data?: { role?: string } };
      showAdminDashboard = json.data?.role === "admin";
    }
  } catch {
    showAdminDashboard = false;
  }

  return (
    <>
      <MarketingFloatingNav showAdminDashboard={showAdminDashboard} />
      {children}
      <MarketingFooter />
    </>
  );
}
