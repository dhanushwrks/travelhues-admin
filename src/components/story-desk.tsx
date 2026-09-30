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
import { spotTypes, type Spot, type SpotCatalogItem, type Story, type StoryDraft } from "@/lib/types";

const emptyDraft = (): StoryDraft => ({
  slug: "",
  title: "",
  summary: "",
  coverUrl: "",
  destination: { name: "", country: "", lat: 13.75, lng: 100.5 },
  creator: { username: "", displayName: "", bio: "", avatarUrl: "" },
});

const emptySpot = (): Spot => ({
  id: "",
  type: "sightseeing",
  title: "",
  description: "",
  images: [],
  lat: 13.75,
  lng: 100.5,
  address: "",
  avgMinutes: 60,
  avgCostThb: 0,
  tags: [],
});

export function StoryDesk({ slug }: { slug?: string }) {
  const router = useRouter();
  const creating = !slug;
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft);
  const [story, setStory] = useState<Story | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [spotCreating, setSpotCreating] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);
  const [catalog, setCatalog] = useState<SpotCatalogItem[]>(
    spotTypes.map((type) => ({ slug: type, label: type, kinds: [] })),
  );

  useEffect(() => {
    let active = true;
    adminApi
      .spotCatalog()
      .then((next) => {
        if (active && next.length > 0) setCatalog(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    adminApi
      .story(slug)
      .then((next) => {
        if (!active) return;
        setStory(next);
        setDraft(toDraft(next));
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load the story");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  function note(message: string) {
    setError("");
    setSaved(message);
  }

  async function saveStory(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved("");
    try {
      if (creating) {
        const created = await adminApi.createStory(draft);
        router.push(`/stories/${created.slug}`);
        return;
      }
      const updated = await adminApi.updateStory(slug, draft);
      setStory(updated);
      setDraft(toDraft(updated));
      note("Saved the story");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the story");
    } finally {
      setPending(false);
    }
  }

  async function removeStory() {
    if (!slug || !window.confirm(`Delete ${draft.title}?`)) return;
    setPending(true);
    try {
      await adminApi.deleteStory(slug);
      router.push("/stories");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the story");
      setPending(false);
    }
  }

  async function saveSpot(event: React.FormEvent) {
    event.preventDefault();
    if (!slug || !spot) return;
    setPending(true);
    setError("");
    setSaved("");
    try {
      const next = spotCreating
        ? await adminApi.createSpot(slug, normalizeSpot(spot))
        : await adminApi.updateSpot(slug, spot.id, normalizeSpot(spot));
      setStory((current) => {
        if (!current) return current;
        const spots = spotCreating
          ? [...current.spots, next]
          : current.spots.map((item) => (item.id === next.id ? next : item));
        return { ...current, spots };
      });
      setSpot(null);
      setSpotCreating(false);
      note("Saved the spot");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the spot");
    } finally {
      setPending(false);
    }
  }

  async function removeSpot(spotId: string) {
    if (!slug || !window.confirm("Delete this spot?")) return;
    setPending(true);
    setError("");
    try {
      await adminApi.deleteSpot(slug, spotId);
      setStory((current) =>
        current
          ? { ...current, spots: current.spots.filter((item) => item.id !== spotId) }
          : current,
      );
      setSpot(null);
      note("Deleted the spot");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete the spot");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-10">
      <form onSubmit={saveStory} className="grid gap-5">
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl font-medium tracking-tight">
            {creating ? "New story" : draft.title || "Story"}
          </h1>
          <PrimaryButton type="submit" disabled={pending}>
            {creating ? "Create story" : "Save story"}
          </PrimaryButton>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {creating ? (
            <Field label="Slug">
              <input
                className={controlClass}
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                required
              />
            </Field>
          ) : null}
          <Field label="Title">
            <input
              className={controlClass}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              required
            />
          </Field>
          <Field label="Cover URL">
            <input
              className={controlClass}
              value={draft.coverUrl}
              onChange={(event) => setDraft({ ...draft, coverUrl: event.target.value })}
              required
            />
          </Field>
          <Field label="Summary">
            <textarea
              className={`${controlClass} min-h-24 md:col-span-2`}
              value={draft.summary}
              onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
              required
            />
          </Field>
        </div>
        <h2 className="text-xl">Place</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Destination">
            <input
              className={controlClass}
              value={draft.destination.name}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  destination: { ...draft.destination, name: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Country">
            <input
              className={controlClass}
              value={draft.destination.country}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  destination: { ...draft.destination, country: event.target.value },
                })
              }
              required
            />
          </Field>
          <NumberField
            label="Latitude"
            value={draft.destination.lat}
            onChange={(lat) =>
              setDraft({ ...draft, destination: { ...draft.destination, lat } })
            }
          />
          <NumberField
            label="Longitude"
            value={draft.destination.lng}
            onChange={(lng) =>
              setDraft({ ...draft, destination: { ...draft.destination, lng } })
            }
          />
        </div>
        <h2 className="text-xl">Creator</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Username">
            <input
              className={controlClass}
              value={draft.creator.username}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  creator: { ...draft.creator, username: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Display name">
            <input
              className={controlClass}
              value={draft.creator.displayName}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  creator: { ...draft.creator, displayName: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Avatar URL">
            <input
              className={controlClass}
              value={draft.creator.avatarUrl}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  creator: { ...draft.creator, avatarUrl: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Bio">
            <textarea
              className={`${controlClass} min-h-24`}
              value={draft.creator.bio}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  creator: { ...draft.creator, bio: event.target.value },
                })
              }
              required
            />
          </Field>
        </div>
        {!creating ? (
          <QuietButton type="button" onClick={removeStory} disabled={pending}>
            Delete story
          </QuietButton>
        ) : null}
      </form>

      {story ? (
        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl">Spots</h2>
            <QuietButton
              type="button"
              onClick={() => {
                setSpotCreating(true);
                setSpot(emptySpot());
              }}
            >
              Add a spot
            </QuietButton>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {story.spots.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block">{item.title}</span>
                  <span className="text-sm text-ink/70">{item.type}</span>
                </span>
                <QuietButton
                  type="button"
                  onClick={() => {
                    setSpotCreating(false);
                    setSpot(item);
                  }}
                >
                  Edit
                </QuietButton>
              </li>
            ))}
          </ul>
          {spot ? (
            <form onSubmit={saveSpot} className="grid gap-4 border border-line bg-paper p-4">
              <h3 className="text-lg">{spotCreating ? "New spot" : spot.title}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {spotCreating ? (
                  <Field label="Id">
                    <input
                      className={controlClass}
                      value={spot.id}
                      onChange={(event) => setSpot({ ...spot, id: event.target.value })}
                      required
                    />
                  </Field>
                ) : null}
                <Field label="Title">
                  <input
                    className={controlClass}
                    value={spot.title}
                    onChange={(event) => setSpot({ ...spot, title: event.target.value })}
                    required
                  />
                </Field>
                <Field label="Type">
                  <select
                    className={controlClass}
                    value={spot.type}
                    onChange={(event) =>
                      setSpot({ ...spot, type: event.target.value as Spot["type"] })
                    }
                  >
                    {catalog.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Address">
                  <input
                    className={controlClass}
                    value={spot.address}
                    onChange={(event) => setSpot({ ...spot, address: event.target.value })}
                    required
                  />
                </Field>
                <NumberField
                  label="Minutes"
                  value={spot.avgMinutes}
                  onChange={(avgMinutes) => setSpot({ ...spot, avgMinutes })}
                />
                <NumberField
                  label="Cost in INR"
                  value={spot.avgCostThb}
                  onChange={(avgCostThb) => setSpot({ ...spot, avgCostThb })}
                />
                <NumberField
                  label="Latitude"
                  value={spot.lat}
                  onChange={(lat) => setSpot({ ...spot, lat })}
                />
                <NumberField
                  label="Longitude"
                  value={spot.lng}
                  onChange={(lng) => setSpot({ ...spot, lng })}
                />
                <Field label="Image URLs">
                  <textarea
                    className={`${controlClass} min-h-20`}
                    value={spot.images.join("\n")}
                    onChange={(event) =>
                      setSpot({
                        ...spot,
                        images: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                      })
                    }
                  />
                </Field>
                <Field label="Tags">
                  <input
                    className={controlClass}
                    value={spot.tags.join(", ")}
                    onChange={(event) =>
                      setSpot({
                        ...spot,
                        tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                      })
                    }
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={`${controlClass} min-h-24 md:col-span-2`}
                    value={spot.description}
                    onChange={(event) =>
                      setSpot({ ...spot, description: event.target.value })
                    }
                    required
                  />
                </Field>
              </div>
              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={pending}>
                  Save spot
                </PrimaryButton>
                {!spotCreating ? (
                  <QuietButton type="button" onClick={() => removeSpot(spot.id)}>
                    Delete spot
                  </QuietButton>
                ) : null}
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {story ? (
        <section className="grid gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl">Itineraries</h2>
            <Link
              href={`/stories/${story.slug}/itineraries/new`}
              className="text-sm underline-offset-4 hover:underline"
            >
              Add an itinerary
            </Link>
          </div>
          <ul className="divide-y divide-line border-y border-line">
            {story.itineraries.map((itinerary) => (
              <li key={itinerary.slug}>
                <Link
                  href={`/stories/${story.slug}/itineraries/${itinerary.slug}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span>
                    <span className="block">{itinerary.title}</span>
                    <span className="text-sm text-ink/70">
                      {itinerary.days.length} days
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Notice error={error} saved={saved} />
    </div>
  );
}

function toDraft(story: Story): StoryDraft {
  return {
    slug: story.slug,
    title: story.title,
    summary: story.summary,
    coverUrl: story.coverUrl,
    destination: story.destination,
    creator: story.creator,
  };
}

function normalizeSpot(spot: Spot): Spot {
  return {
    ...spot,
    images: spot.images.filter(Boolean),
    tags: spot.tags.filter(Boolean),
  };
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        className={controlClass}
        type="number"
        step="any"
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(Number(event.target.value))}
        required
      />
    </Field>
  );
}
