"use client";

import { useRouter } from "next/navigation";

import { FlightDealForm } from "@/components/flight-deal-form";
import { adminApi } from "@/lib/api";
import type { FlightDeal } from "@/lib/types";

export default function NewFlightDealPage() {
  const router = useRouter();

  async function save(body: Partial<FlightDeal>) {
    const created = await adminApi.createFlightDeal(body);
    router.push(`/flight-deals/${created.id}`);
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-medium tracking-tight">New flight deal</h1>
      <FlightDealForm onSave={save} submitLabel="Create deal" />
    </div>
  );
}
