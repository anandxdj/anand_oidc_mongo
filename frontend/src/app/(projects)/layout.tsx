"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ProjectsLogoutButton } from "./logout-button";
import { buttonVariants } from "@/components/ui/button";
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/projects", label: "All projects" },
  { href: "/projects/new", label: "New project" },
  { href: "/user/profile", label: "Profile" },
] as const;

export default function ProjectsConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [role, setRole] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: { role?: string } };
        if (!cancelled) setRole(json.data?.role || "");
      } catch {
        if (!cancelled) setRole("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAdminAccess = role === "admin" || role === "superadmin";
  const hasSuperadminAccess = role === "superadmin";
  const navItems = [
    ...nav,
    ...(hasAdminAccess ? [{ href: "/admin", label: "Admin Dashboard" }] : []),
    ...(hasSuperadminAccess
      ? [{ href: "/superadmin", label: "Super Admin Panel" }]
      : []),
  ];

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-b border-border bg-card/60 px-4 py-6 md:w-56 md:border-b-0 md:border-e">
        <Link
          href="/projects"
          className="block text-sm font-semibold tracking-tight text-foreground no-underline"
        >
          Console
        </Link>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Console">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "justify-start no-underline",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <ProjectsLogoutButton />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
