"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/context/AuthProvider";
import { useTheme } from "@/components/context/ThemeProvider";

type DailyPoint = { date: string; total: number; ongoing: number; completed: number; skipped: number };

export default function StatsPage() {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DailyPoint[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetchRange(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const fetchRange = async (from: string, to: string) => {
    try {
      setError(null);
      setLoading(true);

      const start = new Date(from + "T00:00:00.000Z");
      const end = new Date(to + "T23:59:59.999Z");

      const { data, error } = await supabase
        .from("queue")
        .select("status, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (error) throw error;

      const byDay: Record<string, DailyPoint> = {};
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10);
        byDay[key] = { date: key, total: 0, ongoing: 0, completed: 0, skipped: 0 };
        cursor.setDate(cursor.getDate() + 1);
      }

      (data || []).forEach((row: any) => {
        const key = new Date(row.created_at).toISOString().slice(0, 10);
        if (!byDay[key]) return;
        byDay[key].total += 1;
        if (row.status === "ongoing") byDay[key].ongoing += 1;
        if (row.status === "completed") byDay[key].completed += 1;
        if (row.status === "skipped") byDay[key].skipped += 1;
      });

      setData(Object.values(byDay));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const total = data.reduce((s, d) => s + d.total, 0);
    const ongoing = data.reduce((s, d) => s + d.ongoing, 0);
    const completed = data.reduce((s, d) => s + d.completed, 0);
    const skipped = data.reduce((s, d) => s + d.skipped, 0);
    return { total, ongoing, completed, skipped };
  }, [data]);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="w-full border-b border-black/[.06] dark:border-white/[.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-semibold">Statistics</div>
          <nav className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
            >
              Back to Queue
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center rounded-md h-9 px-3 text-sm font-medium border border-black/[.08] dark:border-white/[.145] hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg border border-black/[.08] dark:border-white/[.145]">
              <div className="text-xs text-foreground/70">Total</div>
              <div className="text-2xl font-semibold">{totals.total}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/[.08] dark:border-white/[.145]">
              <div className="text-xs text-foreground/70">Ongoing</div>
              <div className="text-2xl font-semibold">{totals.ongoing}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/[.08] dark:border-white/[.145]">
              <div className="text-xs text-foreground/70">Completed</div>
              <div className="text-2xl font-semibold">{totals.completed}</div>
            </div>
            <div className="p-4 rounded-lg border border-black/[.08] dark:border-white/[.145]">
              <div className="text-xs text-foreground/70">Skipped</div>
              <div className="text-2xl font-semibold">{totals.skipped}</div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Queue volume over time</h2>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-10 rounded-md border border-black/[.08] dark:border-white/[.145] bg-background px-3"
                />
                <span className="text-sm text-foreground/60">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-10 rounded-md border border-black/[.08] dark:border-white/[.145] bg-background px-3"
                />
              </div>
            </div>

            <div className="rounded-lg border border-black/[.08] dark:border-white/[.145] p-4">
              {loading ? (
                <div className="text-foreground/70">Loading...</div>
              ) : error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : data.length === 0 ? (
                <div className="text-foreground/70 text-sm">No data in range.</div>
              ) : (
                <LineChart points={data} />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function LineChart({ points }: { points: DailyPoint[] }) {
  const width = 800;
  const height = 280;
  const padding = 32;

  const values = points.map((p) => p.total);
  const max = Math.max(1, ...values);

  const x = (i: number) => padding + (i * (width - padding * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => height - padding - (v * (height - padding * 2)) / max;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.total)}`)
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="min-w-full text-foreground/80">
        <rect x="0" y="0" width={width} height={height} fill="none" />
        {/* Axes */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.2" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.2" />
        {/* Line */}
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={p.date} cx={x(i)} cy={y(p.total)} r={3} fill="currentColor" />
        ))}
        {/* Labels */}
        {points.map((p, i) => (
          <text key={p.date + "-label"} x={x(i)} y={height - padding + 16} textAnchor="middle" fontSize="10" className="fill-foreground/60">
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}


