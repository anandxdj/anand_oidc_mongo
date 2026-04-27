"use client";

import { FloatingNav } from "@/components/ui/floating-navbar";
import { Home, LayoutDashboard, LogIn, UserPlus } from "lucide-react";

export function MarketingFloatingNav() {
  return (
    <FloatingNav
      navItems={[
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
      ]}
    />
  );
}
