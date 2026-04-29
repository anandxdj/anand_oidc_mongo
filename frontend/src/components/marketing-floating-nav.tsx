"use client";

import { FloatingNav } from "@/components/ui/floating-navbar";
import { Home, LayoutDashboard, LogIn, Shield, UserPlus } from "lucide-react";

type MarketingFloatingNavProps = {
  showAdminDashboard?: boolean;
};

export function MarketingFloatingNav({
  showAdminDashboard = false,
}: MarketingFloatingNavProps) {
  const navItems = [
    { name: "Home", link: "/", icon: <Home className="size-4" /> },
    {
      name: "Sign in",
      link: "/login",
      icon: <LogIn className="size-4" />,
    },
    {
      name: "Register",
      link: "/register",
      icon: <UserPlus className="size-4" />,
    },
    {
      name: "Console",
      link: "/console",
      icon: <LayoutDashboard className="size-4" />,
    },
    ...(showAdminDashboard
      ? [
          {
            name: "Admin Dashboard",
            link: "/admin",
            icon: <Shield className="size-4" />,
          },
        ]
      : []),
  ];

  return (
    <FloatingNav navItems={navItems} />
  );
}
