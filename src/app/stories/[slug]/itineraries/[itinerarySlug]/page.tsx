"use client";

import { useParams } from "next/navigation";

import { ItineraryDesk } from "@/components/itinerary-desk";

export default function ItineraryPage() {
  const params = useParams<{ slug: string; itinerarySlug: string }>();
  const slug = params.slug;
  const itinerarySlug = params.itinerarySlug;
  if (!slug || !itinerarySlug || Array.isArray(slug) || Array.isArray(itinerarySlug)) {
    return null;
  }
  return <ItineraryDesk storySlug={slug} itinerarySlug={itinerarySlug} />;
}
