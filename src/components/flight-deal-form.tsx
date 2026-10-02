"use client";

import { useEffect, useState } from "react";

import { Field, PrimaryButton, controlClass } from "@/components/fields";
import { adminApi } from "@/lib/api";
import { flightDealOrigins, type FlightDeal, type Story } from "@/lib/types";

const emptyDeal = (): Partial<FlightDeal> => ({
  originIata: "BLR",
  destinationIata: "",
  destinationCity: "",
  destinationCountry: "TH",
  departureDate: "",
  returnDate: "",
  priceInr: 9999,
  affiliateUrl: "",
  affiliatePartner: "",
  headline: "",
  subtitle: "",
  badge: "Deal",
  storyCreatorUsername: "",
  storySlug: "",
  featuredItinerarySlug: "",
  featuredSpotIds: [],
  status: "draft",
  validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  priority: 0,
  externalId: "",
});

export function FlightDealForm({
  initial,
  onSave,
  submitLabel = "Save deal",
}: {
  initial?: Partial<FlightDeal>;
  onSave: (body: Partial<FlightDeal>) => Promise<void>;
  submitLabel?: string;
}) {
  const [draft, setDraft] = useState<Partial<FlightDeal>>({ ...emptyDeal(), ...initial });
  const [stories, setStories] = useState<Story[]>([]);
  const [linkedStory, setLinkedStory] = useState<Story | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi
      .stories()
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  useEffect(() => {
    if (!draft.storySlug) {
      setLinkedStory(null);
      return;
    }
    adminApi
      .story(draft.storySlug)
      .then(setLinkedStory)
      .catch(() => setLinkedStory(null));
  }, [draft.storySlug]);

  function patch(partial: Partial<FlightDeal>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function pickStory(slug: string) {
    const story = stories.find((item) => item.slug === slug);
    if (!story) return;
    patch({
      storySlug: story.slug,
      storyCreatorUsername: story.creator.username,
      destinationCity: story.destination.name,
      destinationCountry: story.destination.country,
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(draft);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="grid max-w-2xl gap-4" onSubmit={submit}>
      {error ? <p className="text-sm text-red">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Origin airport">
          <select
            className={controlClass}
            value={draft.originIata ?? "BLR"}
            onChange={(event) => patch({ originIata: event.target.value })}
          >
            {flightDealOrigins.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination IATA">
          <input
            className={controlClass}
            value={draft.destinationIata ?? ""}
            onChange={(event) => patch({ destinationIata: event.target.value.toUpperCase() })}
            required
            maxLength={3}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Destination city">
          <input
            className={controlClass}
            value={draft.destinationCity ?? ""}
            onChange={(event) => patch({ destinationCity: event.target.value })}
            required
          />
        </Field>
        <Field label="Country code">
          <input
            className={controlClass}
            value={draft.destinationCountry ?? ""}
            onChange={(event) => patch({ destinationCountry: event.target.value.toUpperCase() })}
            required
            maxLength={2}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Departure date">
          <input
            type="date"
            className={controlClass}
            value={draft.departureDate ?? ""}
            onChange={(event) => patch({ departureDate: event.target.value })}
            required
          />
        </Field>
        <Field label="Return date (optional)">
          <input
            type="date"
            className={controlClass}
            value={draft.returnDate ?? ""}
            onChange={(event) => patch({ returnDate: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Price (INR)">
        <input
          type="number"
          className={controlClass}
          value={draft.priceInr ?? 0}
          onChange={(event) => patch({ priceInr: Number(event.target.value) })}
          required
          min={0}
        />
      </Field>
      <Field label="Affiliate URL">
        <input
          className={controlClass}
          value={draft.affiliateUrl ?? ""}
          onChange={(event) => patch({ affiliateUrl: event.target.value })}
          required
          type="url"
        />
      </Field>
      <Field label="Linked story">
        <select
          className={controlClass}
          value={draft.storySlug ?? ""}
          onChange={(event) => pickStory(event.target.value)}
        >
          <option value="">Choose a story</option>
          {stories.map((story) => (
            <option key={story.slug} value={story.slug}>
              {story.title} (@{story.creator.username})
            </option>
          ))}
        </select>
      </Field>
      {linkedStory ? (
        <>
          <Field label="Featured itinerary">
            <select
              className={controlClass}
              value={draft.featuredItinerarySlug ?? ""}
              onChange={(event) => patch({ featuredItinerarySlug: event.target.value })}
            >
              <option value="">None</option>
              {linkedStory.itineraries.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Featured spots (hold Cmd to multi-select)">
            <select
              className={controlClass}
              multiple
              size={Math.min(6, Math.max(3, linkedStory.spots.length))}
              value={draft.featuredSpotIds ?? []}
              onChange={(event) => {
                const selected = [...event.target.selectedOptions].map((option) => option.value);
                patch({ featuredSpotIds: selected });
              }}
            >
              {linkedStory.spots.map((spot) => (
                <option key={spot.id} value={spot.id}>
                  {spot.title}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}
      <Field label="Headline">
        <input
          className={controlClass}
          value={draft.headline ?? ""}
          onChange={(event) => patch({ headline: event.target.value })}
          placeholder="BLR → BKK from ₹12,999"
        />
      </Field>
      <Field label="Status">
        <select
          className={controlClass}
          value={draft.status ?? "draft"}
          onChange={(event) =>
            patch({ status: event.target.value as FlightDeal["status"] })
          }
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </Field>
      <Field label="Valid until">
        <input
          type="datetime-local"
          className={controlClass}
          value={toLocalInput(draft.validUntil)}
          onChange={(event) => patch({ validUntil: fromLocalInput(event.target.value) })}
          required
        />
      </Field>
      <PrimaryButton type="submit" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </PrimaryButton>
    </form>
  );
}

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}
