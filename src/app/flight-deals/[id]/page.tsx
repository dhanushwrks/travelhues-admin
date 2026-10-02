"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FlightDealForm } from "@/components/flight-deal-form";
import { QuietButton } from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { FlightDeal } from "@/lib/types";

export default function EditFlightDealPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<FlightDeal | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi
      .flightDeals()
      .then((items) => {
        const match = items.find((item) => item.id === params.id);
        if (!match) throw new Error("Deal not found");
        setDeal(match);
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not load deal");
      });
  }, [params.id]);

  async function save(body: Partial<FlightDeal>) {
    await adminApi.updateFlightDeal(params.id, body);
    router.refresh();
  }

  async function archive() {
    await adminApi.archiveFlightDeal(params.id);
    router.push("/flight-deals");
  }

  if (error) return <p className="text-sm text-red">{error}</p>;
  if (!deal) return <p className="text-sm">Loading deal</p>;

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-tight">Edit flight deal</h1>
        <QuietButton type="button" onClick={() => void archive()}>
          Archive
        </QuietButton>
      </div>
      <FlightDealForm initial={deal} onSave={save} />
      <Link href="/flight-deals" className="text-sm underline">
        Back to deals
      </Link>
    </div>
  );
}
