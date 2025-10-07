"use client";

import StatsPage from "@/app/stats/page";

export default function AdminStatsProxy() {
  // Reuse the same stats UI under /admin/stats
  return <StatsPage />;
}


