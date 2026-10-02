"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/api";
import type { FlightDeal } from "@/lib/types";

export default function FlightDealsPage() {
  const [deals, setDeals] = useState<FlightDeal[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .flightDeals()
      .then(setDeals)
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load deals");
      });
  }, []);

  return (
    <div className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Flight deals</h1>
          <p className="max-w-lg text-sm text-ink/75">
            Publish fares from Indian hubs and link each deal to a destination story.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/flight-deals/import" className="rounded-md border border-line px-4 py-2 text-sm">
            Import CSV
          </Link>
          <Link href="/flight-deals/new" className="rounded-md bg-red px-4 py-2 text-sm text-white">
            New deal
          </Link>
        </div>
      </div>
      {error ? <p className="text-sm text-red">{error}</p> : null}
      {deals === null && !error ? <p className="text-sm">Loading deals</p> : null}
      <ul className="divide-y divide-line border-y border-line">
        {deals?.map((deal) => (
          <li key={deal.id}>
            <Link href={`/flight-deals/${deal.id}`} className="grid gap-1 py-4">
              <span className="text-lg">
                {deal.headline || `${deal.originIata} → ${deal.destinationIata}`}
              </span>
              <span className="text-sm text-ink/70">
                ₹{deal.priceInr.toLocaleString("en-IN")} · {deal.status} · {deal.storySlug || "No story"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {deals?.length === 0 ? <p className="text-sm text-ink/70">No deals yet.</p> : null}
    </div>
  );
}
