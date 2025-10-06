"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/context/AuthProvider";
import { useTheme } from "@/components/context/ThemeProvider";
import { useRouter } from "next/navigation";

type QueueItem = {
  id: string | number;
  ticket_number?: string | number;
  patient_name?: string;
  position?: number;
  status?: string;
  created_at?: string;
};

type Doctor = {
  id: string;
  name: string;
  specialization?: string;
  is_active: boolean;
};

export default function Home() {
  const { user, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentDoctor, setCurrentDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState<boolean>(false);
  const [patientName, setPatientName] = useState<string>("");
  const [booking, setBooking] = useState<boolean>(false);

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


  const fetchCurrentDoctor = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is fine
        setError(error.message);
      } else {
        setCurrentDoctor(data);
      }
    } catch (err) {
      // Ignore errors for doctor fetching
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchCurrentDoctor();
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
                {isAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                    >
                      Admin
                    </Link>
                    <Link
                      href="/stats"
                      className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                    >
                      Statistics
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                  >
                    Profile
                  </button>
                )}
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
              {currentDoctor ? currentDoctor.name : "Dr. John Doe"}
            </h1>
            {currentDoctor?.specialization && (
              <p className="text-lg text-foreground/70">
                {currentDoctor.specialization}
              </p>
            )}
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
                {queue.map((item, index) => (
                  <li
                    key={String(item.id)}
                    className={`aspect-square rounded-lg border p-4 flex flex-col items-center justify-center text-center gap-2 ${
                      index === 0
                        ? "border-emerald-500/50 dark:border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-black/[.08] dark:border-white/[.145]"
                    }`}
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
                    {index === 0 ? (
                      <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                        Right now
                      </div>
                    ) : (
                      <div className="text-[10px] text-foreground/60 uppercase tracking-wide">
                        {item.status ?? "ongoing"}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {user && (
              <div className="pt-2">
                <button
                  onClick={() => setIsAppointmentOpen(true)}
                  className="inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium bg-foreground text-background hover:opacity-90 transition"
                >
                  Book appointment
                </button>
              </div>
            )}

            <p className="text-xs text-foreground/60">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </section>
        </div>
      </main>

      {/* Profile Drawer (hidden for admin) */}
      {user && !isAdmin && (
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
                  <button
                    onClick={toggleTheme}
                    className="w-full inline-flex items-center justify-between rounded-md h-11 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                  >
                    Dark mode
                    <span className="text-foreground/50">{theme === "dark" ? "On" : "Off"}</span>
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

      {/* Statistics moved to /stats page for admins */}

      {/* Appointment Modal */}
      {isAppointmentOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              if (!booking) setIsAppointmentOpen(false);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Book appointment"
            className="fixed inset-0 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm rounded-lg border border-black/[.08] dark:border-white/[.145] bg-background shadow-xl">
              <div className="px-4 py-3 border-b border-black/[.06] dark:border-white/[.08] flex items-center justify-between">
                <div className="font-semibold">Book appointment</div>
                <button
                  onClick={() => {
                    if (!booking) setIsAppointmentOpen(false);
                  }}
                  className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                >
                  Close
                </button>
              </div>
              <form
                className="p-4 space-y-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!patientName.trim()) return;
                  try {
                    setBooking(true);
                    // Determine next position based on current ongoing queue
                    const nextPosition =
                      queue.length > 0
                        ? Math.max(
                            ...queue
                              .map((q) => (typeof q.position === "number" ? q.position : 0))
                          ) + 1
                        : 1;

                    const nextTicketNumber = nextPosition; // Simple mapping; adjust if your schema differs

                    const { error: insertError } = await supabase
                      .from("queue")
                      .insert([
                        {
                          patient_name: patientName.trim(),
                          position: nextPosition,
                          ticket_number: nextTicketNumber,
                          status: "ongoing",
                        },
                      ]);

                    if (insertError) {
                      setError(insertError.message);
                    } else {
                      setPatientName("");
                      setIsAppointmentOpen(false);
                      await fetchQueue();
                    }
                  } catch (err) {
                    const message = err instanceof Error ? err.message : "Unknown error";
                    setError(message);
                  } finally {
                    setBooking(false);
                  }
                }}
              >
                <label className="block text-sm font-medium text-foreground/80">Your name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter full name"
                  className="mt-1 w-full rounded-md border border-black/[.08] dark:border-white/[.145] px-3 h-10 bg-background"
                  disabled={booking}
                />
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!booking) setIsAppointmentOpen(false);
                    }}
                    className="inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
                    disabled={booking}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md h-10 px-4 text-sm font-medium bg-foreground text-background hover:opacity-90 transition disabled:opacity-60"
                    disabled={booking || !patientName.trim()}
                  >
                    {booking ? "Booking..." : "Confirm"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
