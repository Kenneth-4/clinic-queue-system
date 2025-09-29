"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/context/AuthProvider";
import { useRouter } from "next/navigation";

type QueueItem = {
  id: string | number;
  ticket_number?: string | number;
  patient_name?: string;
  position?: number;
  status?: string;
  created_at?: string;
};

export default function Home() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const fetchQueue = async () => {
    setError(null);
    // If it's the initial load, we keep 'loading' true; otherwise show 'refreshing'
    const isInitial = queue.length === 0 && loading;
    if (!isInitial) setRefreshing(true);

    // NOTE: Adjust table and column names if your schema differs
    const { data, error } = await supabase
      .from("queue")
      .select("id, ticket_number, patient_name, position, status, created_at")
      .eq("status", "ongoing")
      .order("position", { ascending: true });

    if (error) {
      setError(error.message);
      setQueue([]);
    } else {
      setQueue(data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchQueue();
    // Optionally, poll every 20s. Comment out if not desired.
    const interval = setInterval(fetchQueue, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top Bar */}
      <header className="w-full border-b border-black/[.06] dark:border-white/[.08]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold">Clinic Queue System</div>
          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                >
                  Profile
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium bg-foreground text-background hover:opacity-90 transition"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto flex flex-col gap-10">
          <section className="text-center flex flex-col items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.145] px-3 py-1 text-xs/5 text-foreground/70">
              Doctor in charge:
            </span>
            <h1 className="text-4xl sm:text-5xl font-sans font-semibold tracking-tight">
              Dr. John Doe
            </h1>
          </section>

          {/* Ongoing Queue */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Ongoing Queue</h2>
              <button
                onClick={fetchQueue}
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* States */}
            {loading ? (
              <div className="text-foreground/70">Loading queue...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : queue.length === 0 ? (
              <div className="text-foreground/70">No patients in the ongoing queue.</div>
            ) : (
              <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {queue.map((item) => (
                  <li
                    key={String(item.id)}
                    className="aspect-square rounded-lg border border-black/[.08] dark:border-white/[.145] p-4 flex flex-col items-center justify-center text-center gap-2"
                  >
                    <div className="w-14 h-14 rounded-md bg-foreground text-background flex items-center justify-center text-xl font-semibold">
                      {item.position ?? "-"}
                    </div>
                    <div className="font-medium truncate max-w-full">
                      {item.patient_name || "Patient"}
                    </div>
                    <div className="text-xs text-foreground/70">
                      Ticket {item.ticket_number ?? "—"}
                    </div>
                    <div className="text-[10px] text-foreground/60 uppercase tracking-wide">
                      {item.status ?? "ongoing"}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-foreground/60">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </section>
        </div>
      </main>

      {/* Profile Drawer */}
      {user && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/40 transition-opacity ${
              isProfileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setIsProfileOpen(false)}
            aria-hidden={!isProfileOpen}
          />

          {/* Drawer Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Profile and Settings"
            className={`fixed right-0 top-0 h-dvh w-full max-w-sm bg-background border-l border-black/[.08] dark:border-white/[.145] shadow-xl transition-transform duration-300 flex flex-col ${
              isProfileOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="h-16 px-4 border-b border-black/[.06] dark:border-white/[.08] flex items-center justify-between">
              <div className="font-semibold">Profile</div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                aria-label="Close profile"
              >
                Close
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex flex-col gap-6">
              <section className="space-y-1">
                <h3 className="text-sm font-medium text-foreground/80">Signed in as</h3>
                <p className="text-base font-semibold break-words">{user.email}</p>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-medium text-foreground/80">Settings</h3>
                <div className="space-y-2">
                  <button className="w-full inline-flex items-center justify-between rounded-md h-11 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition">
                    Account settings
                    <span className="text-foreground/50">›</span>
                  </button>
                  <button className="w-full inline-flex items-center justify-between rounded-md h-11 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition">
                    Notification preferences
                    <span className="text-foreground/50">›</span>
                  </button>
                </div>
              </section>

              <div className="pt-2 border-t border-black/[.06] dark:border-white/[.08]">
                <button
                  onClick={async () => {
                    await signOut();
                    setIsProfileOpen(false);
                    router.push("/");
                  }}
                  className="w-full inline-flex items-center justify-center rounded-md bg-red-600 text-white h-11 px-5 font-medium hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
