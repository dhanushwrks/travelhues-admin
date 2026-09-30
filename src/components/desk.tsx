"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { Field, PrimaryButton, controlClass } from "@/components/fields";
import { clearToken, readToken, signIn } from "@/lib/api";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("admin-session", onStoreChange);
  return () => window.removeEventListener("admin-session", onStoreChange);
}

export function Desk({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore(subscribe, readToken, () => null);
  if (!token) return <Login />;

  return (
    <div className="min-h-dvh bg-mist md:grid md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="flex items-center gap-5 bg-ink px-4 py-3 text-paper md:flex-col md:items-stretch md:gap-0 md:px-5 md:py-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/travelhues-mark.png"
            alt="Travelhues"
            width={40}
            height={40}
            priority
          />
        </Link>
        <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-1 md:mt-8 md:flex-col md:gap-1">
          <RailLink href="/">Desk</RailLink>
          <RailLink href="/countries">Countries</RailLink>
          <RailLink href="/categories">Categories</RailLink>
          <RailLink href="/waitlist">Waitlist</RailLink>
          <RailLink href="/settings">Settings</RailLink>
          <RailLink href="/stories">Stories</RailLink>
        </nav>
        <button
          type="button"
          className="text-sm text-paper/80 md:mt-auto"
          onClick={() => {
            clearToken();
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="px-5 py-8 md:px-12 md:py-10">
        <div className="mx-auto w-full max-w-[880px]">{children}</div>
      </main>
    </div>
  );
}

function RailLink({ href, children }: { href: string; children: string }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`rounded-md px-2 py-1.5 text-sm md:border-l-2 md:px-3 ${
        active
          ? "bg-white/10 text-white md:border-red"
          : "text-paper/70 md:border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}

function Login() {
  const [token, setTokenValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await signIn(token.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-mist px-5">
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-sm gap-5 bg-ink px-6 py-8 text-paper"
      >
        <Image
          src="/travelhues-mark.png"
          alt=""
          width={48}
          height={48}
        />
        <div className="grid gap-2">
          <h1 className="text-2xl font-medium">Travelhues desk</h1>
          <p className="text-sm text-paper/75">
            Sign in with the admin token from the API.
          </p>
        </div>
        <Field label="Admin token">
          <input
            className={`${controlClass} text-ink`}
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(event) => setTokenValue(event.target.value)}
            required
          />
        </Field>
        {error ? <p className="text-sm text-red">{error}</p> : null}
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Signing in" : "Sign in"}
        </PrimaryButton>
      </form>
    </div>
  );
}
