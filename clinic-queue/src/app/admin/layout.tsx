"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/context/AuthProvider";
import { useTheme } from "@/components/context/ThemeProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return; // wait for auth to resolve
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user && !isAdmin) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [user, isAdmin, loading, router]);

  if (!ready) return null;

  const navItem = (
    href: string,
    label: string,
  ) => (
    <Link
      href={href}
      className={`block w-full text-left px-3 h-9 rounded-md text-sm font-medium flex items-center border border-transparent hover:bg-black/[.04] dark:hover:bg-white/[.06] transition ${
        pathname === href ? "bg-black/[.04] dark:bg-white/[.06]" : ""
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-dvh">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-black/[.06] dark:border-white/[.08] bg-background p-4 flex flex-col gap-3">
        <div className="px-1 pb-2">
          <div className="font-semibold">Admin</div>
          <div className="text-xs text-foreground/60">Clinic Queue System</div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItem("/admin", "Queue")}
          {navItem("/admin/doctors", "Doctor in charge")}
          {navItem("/admin/stats", "Statistics")}
        </nav>

        <div className="mt-auto space-y-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-full inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="w-full inline-flex items-center justify-center rounded-md bg-red-600 text-white h-9 px-3 text-sm font-medium hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-h-dvh" style={{ marginLeft: 256 }}>
        <div className="px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}


