"use client";

import Link from "next/link";
import { useState } from "react";

import { Field, PrimaryButton, controlClass } from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { FlightDealImportResult } from "@/lib/types";

const sampleHeader =
  "origin_iata,destination_iata,destination_city,destination_country,departure_date,return_date,price_inr,affiliate_url,story_creator_username,story_slug,status,valid_until";

export default function ImportFlightDealsPage() {
  const [csv, setCsv] = useState(`${sampleHeader}\n`);
  const [result, setResult] = useState<FlightDealImportResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const next = await adminApi.importFlightDeals({ csv });
      setResult(next);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="grid gap-1">
        <h1 className="text-3xl font-medium tracking-tight">Import flight deals</h1>
        <p className="text-sm text-ink/75">
          Paste CSV with the header row. See travelhues-app seed/flight-deals-api.md for columns.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={submit}>
        <Field label="CSV">
          <textarea
            className={`${controlClass} min-h-64 font-mono text-xs`}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-red">{error}</p> : null}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? "Importing…" : "Import"}
        </PrimaryButton>
      </form>
      {result ? (
        <div className="grid gap-2 rounded-md border border-line p-4 text-sm">
          <p>
            Created {result.created}, updated {result.updated}.
          </p>
          {result.errors.length ? (
            <ul className="grid gap-1 text-red">
              {result.errors.map((item) => (
                <li key={`${item.row}-${item.message}`}>
                  Row {item.row}: {item.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink/70">No row errors.</p>
          )}
        </div>
      ) : null}
      <Link href="/flight-deals" className="text-sm underline">
        Back to deals
      </Link>
    </div>
  );
}
