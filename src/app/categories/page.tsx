"use client";

import { useEffect, useState } from "react";

import { Field, Notice, PrimaryButton, controlClass } from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { SpotCatalogItem } from "@/lib/types";

export default function CategoriesPage() {
  const [catalog, setCatalog] = useState<SpotCatalogItem[] | null>(null);
  const [category, setCategory] = useState("");
  const [kindDrafts, setKindDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi
      .spotCatalog()
      .then((next) => {
        if (active) setCatalog(next);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load categories");
      });
    return () => {
      active = false;
    };
  }, []);

  function update(next: SpotCatalogItem[]) {
    setSaved("");
    setCatalog(next);
  }

  function addCategory() {
    const label = category.trim();
    if (!label || !catalog) return;
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug || catalog.some((item) => item.slug === slug)) {
      setError("That category is already in the list");
      return;
    }
    setError("");
    update([...catalog, { slug, label, kinds: [] }]);
    setCategory("");
  }

  async function onSave() {
    if (!catalog) return;
    setPending(true);
    setError("");
    setSaved("");
    try {
      const next = await adminApi.saveSpotCatalog(catalog);
      setCatalog(next);
      setSaved("Categories saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save categories");
    } finally {
      setPending(false);
    }
  }

  if (!catalog) {
    return error ? <p className="text-sm text-red">{error}</p> : <p className="text-sm">Loading categories</p>;
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Categories</h1>
          <p className="max-w-md text-sm leading-6 text-ink/75">
            Creators pick a category and a kind when they add a spot.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => void onSave()} disabled={pending}>
          {pending ? "Saving" : "Save categories"}
        </PrimaryButton>
      </div>
      <Notice error={error} saved={saved} />
      <ul className="grid gap-6">
        {catalog.map((item) => (
          <li key={item.slug} className="grid gap-3 border border-line bg-paper p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg">{item.label}</h2>
              <button
                type="button"
                className="text-sm text-ink/70"
                onClick={() => update(catalog.filter((entry) => entry.slug !== item.slug))}
              >
                Remove
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {item.kinds.map((kind) => (
                <li key={kind} className="flex items-center gap-2 rounded-full bg-mist px-3 py-1 text-sm">
                  {kind}
                  <button
                    type="button"
                    aria-label={`Remove ${kind}`}
                    onClick={() =>
                      update(
                        catalog.map((entry) =>
                          entry.slug === item.slug
                            ? { ...entry, kinds: entry.kinds.filter((name) => name !== kind) }
                            : entry,
                        ),
                      )
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const name = (kindDrafts[item.slug] ?? "").trim();
                if (!name) return;
                if (item.kinds.some((kind) => kind.toLowerCase() === name.toLowerCase())) {
                  setError(`${name} is already a kind of ${item.label}`);
                  return;
                }
                setError("");
                update(
                  catalog.map((entry) =>
                    entry.slug === item.slug ? { ...entry, kinds: [...entry.kinds, name] } : entry,
                  ),
                );
                setKindDrafts({ ...kindDrafts, [item.slug]: "" });
              }}
            >
              <input
                value={kindDrafts[item.slug] ?? ""}
                onChange={(event) => setKindDrafts({ ...kindDrafts, [item.slug]: event.target.value })}
                placeholder="Add a kind"
                aria-label={`Add a kind to ${item.label}`}
                className={controlClass}
              />
              <PrimaryButton type="submit">Add</PrimaryButton>
            </form>
          </li>
        ))}
      </ul>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addCategory();
        }}
      >
        <Field label="New category">
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Wellness"
            className={controlClass}
          />
        </Field>
        <PrimaryButton type="submit">Add category</PrimaryButton>
      </form>
    </div>
  );
}
