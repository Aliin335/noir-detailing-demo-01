import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/admin/dashboard-sidebar";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = {
  title: "NOIR Admin",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="min-h-screen bg-obsidian text-noir-text">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">{children}</div>
      </main>
    </div>
  );
}
