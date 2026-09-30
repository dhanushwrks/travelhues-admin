"use client";

import { useEffect, useState } from "react";

import { Field, Notice, PrimaryButton, controlClass } from "@/components/fields";
import { adminApi, apiBase } from "@/lib/api";
import type { Settings } from "@/lib/types";

type Country = { code: string; name: string };

export default function CountriesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [openCodes, setOpenCodes] = useState<string[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.settings(),
      fetch(`${apiBase}/countries`).then(
        (response) => {
          if (!response.ok) throw new Error("Could not load countries");
          return response.json() as Promise<Country[]>;
        },
      ),
    ])
      .then(([nextSettings, nextCountries]) => {
        if (!active) return;
        const codes = nextSettings.app.enabledCountries ?? [];
        setSettings(nextSettings);
        setSavedCodes(codes);
        setOpenCodes(codes);
        setCountries(nextCountries);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load countries");
      });
    return () => {
      active = false;
    };
  }, []);

  const names = new Map(countries.map((country) => [country.code, country.name]));
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? countries
        .filter(
          (country) =>
            !openCodes.includes(country.code) &&
            (country.name.toLowerCase().includes(needle) ||
              country.code.toLowerCase().includes(needle)),
        )
        .slice(0, 8)
    : [];
  const dirty = !sameCodes(openCodes, savedCodes);

  async function onSave() {
    if (!settings) return;
    setPending(true);
    setError("");
    setSaved("");
    try {
      const updated = await adminApi.saveSettings({
        ...settings,
        app: { ...settings.app, enabledCountries: openCodes },
      });
      setSettings(updated);
      setSavedCodes(updated.app.enabledCountries);
      setOpenCodes(updated.app.enabledCountries);
      setSaved("Countries saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save countries");
    } finally {
      setPending(false);
    }
  }

  if (!settings) {
    return error ? <p className="text-sm text-red">{error}</p> : <p className="text-sm">Loading countries</p>;
  }

  return (
    <div className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Countries</h1>
          <p className="max-w-md text-sm leading-6 text-ink/75">
            Creators can start a story or a glimpse only in a country that is open.
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => void onSave()} disabled={pending || !dirty}>
          {pending ? "Saving" : "Save countries"}
        </PrimaryButton>
      </div>
      <Notice error={error} saved={saved} />
      <section className="grid gap-3">
        <h2 className="text-sm text-ink/70">Open</h2>
        {openCodes.length === 0 ? (
          <p className="text-sm">None open. Creators cannot publish until a country is open.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {openCodes.map((code) => (
              <li key={code} className="flex items-center justify-between gap-4 py-3">
                <span>{names.get(code) ?? code}</span>
                <button
                  type="button"
                  className="text-sm text-ink/70"
                  onClick={() => {
                    setSaved("");
                    setOpenCodes(openCodes.filter((item) => item !== code));
                  }}
                >
                  Close
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Field label="Add a country">
        <input
          className={controlClass}
          value={query}
          placeholder="Find a country"
          onChange={(event) => setQuery(event.target.value)}
        />
      </Field>
      {needle && matches.length === 0 ? (
        <p className="text-sm text-ink/70">No country to add for that search.</p>
      ) : null}
      {matches.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line">
          {matches.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 py-3 text-left"
                onClick={() => {
                  setSaved("");
                  setOpenCodes([...openCodes, country.code]);
                  setQuery("");
                }}
              >
                <span>{country.name}</span>
                <span className="text-sm text-ink/70">Open</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function sameCodes(left: string[], right: string[]) {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((code, index) => code === b[index]);
}
