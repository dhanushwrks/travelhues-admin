"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/api";
import type { Settings, Story, WaitlistRequest } from "@/lib/types";

type DeskState = {
  settings: Settings;
  requests: WaitlistRequest[];
  stories: Story[];
  countries: { code: string; name: string }[];
};

export default function DeskHome() {
  const [desk, setDesk] = useState<DeskState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.settings(),
      adminApi.waitlist(),
      adminApi.stories(),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/countries`).then(
        (response) => {
          if (!response.ok) throw new Error("Could not load countries");
          return response.json() as Promise<{ code: string; name: string }[]>;
        },
      ),
    ])
      .then(([settings, requests, stories, countries]) => {
        if (active) setDesk({ settings, requests, stories, countries });
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load the desk");
      });
    return () => {
      active = false;
    };
  }, []);

  const names = new Map(desk?.countries.map((country) => [country.code, country.name]));
  const open = desk?.settings.app.enabledCountries.map((code) => names.get(code) ?? code) ?? [];
  const waiting = desk?.requests.filter((request) => request.status === "pending") ?? [];

  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <h1 className="text-3xl font-medium tracking-tight">Desk</h1>
        <p className="max-w-md text-sm leading-6 text-ink/75">
          Countries a creator can publish in, the people waiting to join, and the settings the app
          follows.
        </p>
      </div>
      {error ? <p className="text-sm text-red">{error}</p> : null}
      {desk === null && !error ? <p className="text-sm">Loading the desk</p> : null}
      {desk ? (
        <ul className="divide-y divide-line border-y border-line">
          <LedgerLink href="/countries" label="Countries">
            <span className="text-lg">{open.length > 0 ? open.join(", ") : "None open"}</span>
            <span className="text-sm text-ink/70">
              {open.length === 0
                ? "Creators cannot publish until a country is open"
                : "Open for stories and glimpses"}
            </span>
          </LedgerLink>
          <LedgerLink href="/waitlist" label="Waitlist">
            <span className="text-lg">
              {waiting.length === 0
                ? "No one is waiting"
                : waiting.length === 1
                  ? waiting[0].name
                  : `${waiting.length} people waiting`}
            </span>
            <span className="text-sm text-ink/70">
              {waiting.length > 1
                ? waiting.map((request) => request.name).join(", ")
                : waiting.length === 0
                  ? "New requests show up here"
                  : "Accept a request, then send an invite"}
            </span>
          </LedgerLink>
          <LedgerLink href="/settings" label="Settings">
            <span className="text-lg">{desk.settings.app.name}</span>
            <span className="text-sm text-ink/70">
              {desk.settings.api.contentPublished ? "Stories are public" : "Stories are hidden"}
              {". "}
              {desk.settings.app.mapsEnabled ? "Maps are on" : "Maps are off"}
            </span>
          </LedgerLink>
          <LedgerLink href="/stories" label="Stories">
            <span className="text-lg">
              {desk.stories.length === 0
                ? "No stories yet"
                : desk.stories.length === 1
                  ? desk.stories[0].title
                  : `${desk.stories.length} stories`}
            </span>
            <span className="text-sm text-ink/70">Spots and the days built from them</span>
          </LedgerLink>
        </ul>
      ) : null}
    </div>
  );
}

function LedgerLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="grid gap-1 py-5 md:grid-cols-[9rem_minmax(0,1fr)] md:items-baseline md:gap-6"
      >
        <span className="text-sm text-ink/70">{label}</span>
        <span className="grid gap-1">{children}</span>
      </Link>
    </li>
  );
}
