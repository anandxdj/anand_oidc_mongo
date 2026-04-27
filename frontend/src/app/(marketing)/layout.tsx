import { MarketingFloatingNav } from "@/components/marketing-floating-nav";
import { MarketingFooter } from "@/components/marketing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingFloatingNav />
      {children}
      <MarketingFooter />
    </>
  );
}
