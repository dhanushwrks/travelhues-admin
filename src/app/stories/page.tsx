"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { adminApi } from "@/lib/api";
import type { Story } from "@/lib/types";

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi
      .stories()
      .then((next) => {
        if (active) setStories(next);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load stories");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Stories</h1>
          <p className="max-w-md text-sm text-ink/75">
            Each story owns its spots and the itineraries built from them.
          </p>
        </div>
        <Link href="/stories/new" className="rounded-md bg-red px-4 py-2 text-sm text-white">
          New story
        </Link>
      </div>
      {error ? <p className="text-sm text-red">{error}</p> : null}
      {stories === null && !error ? <p className="text-sm">Loading stories</p> : null}
      <ul className="divide-y divide-line border-y border-line">
        {stories?.map((story) => (
          <li key={story.slug}>
            <Link
              href={`/stories/${story.slug}`}
              className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 py-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.coverUrl} alt="" className="h-[72px] w-[72px] object-cover" />
              <span className="grid gap-1">
                <span className="text-lg">{story.title}</span>
                <span className="text-sm text-ink/70">
                  {story.destination.name}, {story.destination.country}. {story.spots.length} spots,{" "}
                  {story.itineraries.length} itineraries.
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {stories?.length === 0 ? <p className="text-sm">No stories yet. Create the first one.</p> : null}
    </div>
  );
}
