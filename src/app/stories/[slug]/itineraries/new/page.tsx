"use client";

import { useParams } from "next/navigation";

import { ItineraryDesk } from "@/components/itinerary-desk";

export default function NewItineraryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  if (!slug || Array.isArray(slug)) return null;
  return <ItineraryDesk storySlug={slug} />;
}
