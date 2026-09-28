"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Field,
  Notice,
  PrimaryButton,
  QuietButton,
  controlClass,
} from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { Block, Day, Itinerary, Spot } from "@/lib/types";

const emptyItinerary = (): Itinerary => ({
  slug: "",
  title: "",
  summary: "",
  coverUrl: "",
  days: [{ title: "Day 1", blocks: [{ kind: "note", body: "" }] }],
});

export function ItineraryDesk({
  storySlug,
  itinerarySlug,
}: {
  storySlug: string;
  itinerarySlug?: string;
}) {
  const router = useRouter();
  const creating = !itinerarySlug;
  const [itinerary, setItinerary] = useState<Itinerary>(emptyItinerary);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .story(storySlug)
      .then((story) => {
        if (!active) return;
        setSpots(story.spots);
        if (!itinerarySlug) {
          setItinerary((current) => ({ ...current, coverUrl: story.coverUrl }));
          return;
        }
        const found = story.itineraries.find((item) => item.slug === itinerarySlug);
        if (!found) {
          setError("That itinerary was not found");
          return;
        }
        setItinerary(found);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load the itinerary");
      });
    return () => {
      active = false;
    };
  }, [storySlug, itinerarySlug]);

  function updateDay(index: number, day: Day) {
    setItinerary((current) => ({
      ...current,
      days: current.days.map((item, itemIndex) => (itemIndex === index ? day : item)),
    }));
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved("");
    try {
      if (creating) {
        const created = await adminApi.createItinerary(storySlug, itinerary);
        router.push(`/stories/${storySlug}/itineraries/${created.slug}`);
        return;
      }
      const updated = await adminApi.updateItinerary(storySlug, itinerarySlug, {
        ...itinerary,
        slug: itinerarySlug,
      });
      setItinerary(updated);
      setSaved("Saved the itinerary");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the itinerary");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    if (!itinerarySlug || !window.confirm(`Delete ${itinerary.title}?`)) return;
    setPending(true);
    try {
      await adminApi.deleteItinerary(storySlug, itinerarySlug);
      router.push(`/stories/${storySlug}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the itinerary");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSave} className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <Link href={`/stories/${storySlug}`} className="text-sm text-ink/70">
            Back to the story
          </Link>
          <h1 className="text-3xl font-medium tracking-tight">
            {creating ? "New itinerary" : itinerary.title || "Itinerary"}
          </h1>
        </div>
        <PrimaryButton type="submit" disabled={pending}>
          {creating ? "Create itinerary" : "Save itinerary"}
        </PrimaryButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {creating ? (
          <Field label="Slug">
            <input
              className={controlClass}
              value={itinerary.slug}
              onChange={(event) => setItinerary({ ...itinerary, slug: event.target.value })}
              required
            />
          </Field>
        ) : null}
        <Field label="Title">
          <input
            className={controlClass}
            value={itinerary.title}
            onChange={(event) => setItinerary({ ...itinerary, title: event.target.value })}
            required
          />
        </Field>
        <Field label="Cover URL">
          <input
            className={controlClass}
            value={itinerary.coverUrl}
            onChange={(event) => setItinerary({ ...itinerary, coverUrl: event.target.value })}
            required
          />
        </Field>
        <Field label="Summary">
          <textarea
            className={`${controlClass} min-h-24 md:col-span-2`}
            value={itinerary.summary}
            onChange={(event) => setItinerary({ ...itinerary, summary: event.target.value })}
            required
          />
        </Field>
      </div>
      {itinerary.days.map((day, dayIndex) => (
        <section key={dayIndex} className="grid gap-3 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Day {dayIndex + 1}</h2>
            <QuietButton
              type="button"
              onClick={() =>
                setItinerary((current) => ({
                  ...current,
                  days: current.days.filter((_, index) => index !== dayIndex),
                }))
              }
              disabled={itinerary.days.length === 1}
            >
              Remove day
            </QuietButton>
          </div>
          <Field label="Day title">
            <input
              className={controlClass}
              value={day.title}
              onChange={(event) => updateDay(dayIndex, { ...day, title: event.target.value })}
              required
            />
          </Field>
          {day.blocks.map((block, blockIndex) => (
            <BlockRow
              key={blockIndex}
              block={block}
              spots={spots}
              onChange={(next) =>
                updateDay(dayIndex, {
                  ...day,
                  blocks: day.blocks.map((item, index) =>
                    index === blockIndex ? next : item,
                  ),
                })
              }
              onMove={(direction) => {
                const target = blockIndex + direction;
                if (target < 0 || target >= day.blocks.length) return;
                const blocks = [...day.blocks];
                const [moved] = blocks.splice(blockIndex, 1);
                if (!moved) return;
                blocks.splice(target, 0, moved);
                updateDay(dayIndex, { ...day, blocks });
              }}
              onRemove={() =>
                updateDay(dayIndex, {
                  ...day,
                  blocks: day.blocks.filter((_, index) => index !== blockIndex),
                })
              }
            />
          ))}
          <div className="flex gap-3">
            <QuietButton
              type="button"
              onClick={() =>
                updateDay(dayIndex, {
                  ...day,
                  blocks: [...day.blocks, { kind: "note", body: "" }],
                })
              }
            >
              Add a note
            </QuietButton>
            <QuietButton
              type="button"
              onClick={() =>
                updateDay(dayIndex, {
                  ...day,
                  blocks: [
                    ...day.blocks,
                    { kind: "spot", spotId: spots[0]?.id ?? "", body: "" },
                  ],
                })
              }
              disabled={spots.length === 0}
            >
              Add a spot
            </QuietButton>
          </div>
        </section>
      ))}
      <QuietButton
        type="button"
        onClick={() =>
          setItinerary((current) => ({
            ...current,
            days: [
              ...current.days,
              { title: `Day ${current.days.length + 1}`, blocks: [] },
            ],
          }))
        }
      >
        Add a day
      </QuietButton>
      {!creating ? (
        <QuietButton type="button" onClick={onDelete} disabled={pending}>
          Delete itinerary
        </QuietButton>
      ) : null}
      <Notice error={error} saved={saved} />
    </form>
  );
}

function BlockRow({
  block,
  spots,
  onChange,
  onMove,
  onRemove,
}: {
  block: Block;
  spots: Spot[];
  onChange: (block: Block) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid gap-3 bg-paper p-3 md:grid-cols-[140px_minmax(0,1fr)_auto]">
      <select
        className={controlClass}
        value={block.kind}
        onChange={(event) => {
          if (event.target.value === "note") onChange({ kind: "note", body: block.body });
          else
            onChange({
              kind: "spot",
              spotId: spots[0]?.id ?? "",
              body: block.body,
            });
        }}
      >
        <option value="note">Note</option>
        <option value="spot">Spot</option>
      </select>
      <div className="grid gap-2">
        {block.kind === "spot" ? (
          <select
            className={controlClass}
            value={block.spotId}
            onChange={(event) => onChange({ ...block, spotId: event.target.value })}
          >
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.title}
              </option>
            ))}
          </select>
        ) : null}
        <textarea
          className={`${controlClass} min-h-16`}
          value={block.body}
          onChange={(event) => onChange({ ...block, body: event.target.value })}
          required
        />
      </div>
      <div className="flex gap-2 md:flex-col">
        <QuietButton type="button" onClick={() => onMove(-1)}>
          Up
        </QuietButton>
        <QuietButton type="button" onClick={() => onMove(1)}>
          Down
        </QuietButton>
        <QuietButton type="button" onClick={onRemove}>
          Remove
        </QuietButton>
      </div>
    </div>
  );
}
