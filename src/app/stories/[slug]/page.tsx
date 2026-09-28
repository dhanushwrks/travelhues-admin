"use client";

import { useParams } from "next/navigation";

import { StoryDesk } from "@/components/story-desk";

export default function StoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  if (!slug || Array.isArray(slug)) return null;
  return <StoryDesk slug={slug} />;
}
