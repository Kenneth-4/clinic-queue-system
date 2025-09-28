import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full text-center flex flex-col items-center gap-8">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center justify-center rounded-full border border-black/[.08] dark:border-white/[.145] px-3 py-1 text-xs/5 text-foreground/70">
            Welcome to
          </span>
          <h1 className="text-4xl sm:text-5xl font-sans font-semibold tracking-tight">
            Clinic Queue System
          </h1>
          <p className="text-foreground/70 text-base sm:text-lg max-w-2xl mx-auto">
            Streamline patient check-ins and manage waiting rooms efficiently. Log in or
            create an account to get started.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-foreground text-background h-11 px-5 font-medium hover:opacity-90 transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-black/[.08] dark:border-white/[.145] h-11 px-5 font-medium hover:bg-black/[.04] dark:hover:bg-white/[.06] transition"
          >
            Create account
          </Link>
        </div>

        <p className="text-xs text-foreground/60">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
