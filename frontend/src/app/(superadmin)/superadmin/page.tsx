import Link from "next/link";
import { Crown, Shield, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Super Admin Panel",
};

export default function SuperadminPage() {
  return (
    <main className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="size-4" aria-hidden />
            Super admin controls
          </CardTitle>
          <CardDescription>
            This panel is visible only to superadmin users.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline" }), "inline-flex items-center gap-2 no-underline")}
          >
            <Shield className="size-4" aria-hidden />
            Open admin dashboard
          </Link>
          <Link
            href="/admin/users"
            className={cn(buttonVariants({ variant: "ghost" }), "inline-flex items-center gap-2 no-underline")}
          >
            <Users className="size-4" aria-hidden />
            Manage users
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
