"use client";

import { useAuth } from "@/components/context/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="max-w-2xl w-full text-center flex flex-col items-center gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl sm:text-5xl font-sans font-semibold tracking-tight">
            Welcome to your Dashboard
          </h1>
          <p className="text-foreground/70 text-base sm:text-lg">
            Hello, {user?.user_metadata?.full_name || user?.email}! You're successfully logged in.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="inline-flex items-center justify-center rounded-md bg-red-600 text-white h-11 px-5 font-medium hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
