"use client";

import { useEffect, useState } from "react";

import {
  Field,
  Notice,
  PrimaryButton,
  controlClass,
} from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [origins, setOrigins] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, setPending] = useState(false);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>([]);
  const [countryQuery, setCountryQuery] = useState("");

  useEffect(() => {
    let active = true;
    adminApi
      .settings()
      .then((next) => {
        if (!active) return;
        setSettings(next);
        setOrigins(next.api.corsOrigins.join("\n"));
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load settings");
      });
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/countries`)
      .then((response) => response.json())
      .then((payload: { code: string; name: string }[]) => {
        if (active) setCountries(payload);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setPending(true);
    setError("");
    setSaved("");
    const next: Settings = {
      ...settings,
      api: {
        ...settings.api,
        corsOrigins: origins.split("\n").map((line) => line.trim()).filter(Boolean),
      },
    };
    try {
      const updated = await adminApi.saveSettings(next);
      setSettings(updated);
      setOrigins(updated.api.corsOrigins.join("\n"));
      setSaved("Saved settings");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save settings");
    } finally {
      setPending(false);
    }
  }

  if (!settings) {
    return error ? <p className="text-sm text-red">{error}</p> : <p className="text-sm">Loading settings</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <div className="flex items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-3xl font-medium tracking-tight">Settings</h1>
          <p className="max-w-md text-sm text-ink/75">
            These values are what the traveler app and the API follow.
          </p>
        </div>
        <PrimaryButton type="submit" disabled={pending}>
          Save settings
        </PrimaryButton>
      </div>
      <section className="grid gap-4">
        <h2 className="text-xl">App</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              className={controlClass}
              value={settings.app.name}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  app: { ...settings.app, name: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Public URL">
            <input
              className={controlClass}
              value={settings.app.publicUrl}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  app: { ...settings.app, publicUrl: event.target.value },
                })
              }
              required
            />
          </Field>
          <Field label="Tagline">
            <textarea
              className={`${controlClass} min-h-20 md:col-span-2`}
              value={settings.app.tagline}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  app: { ...settings.app, tagline: event.target.value },
                })
              }
              required
            />
          </Field>
        </div>
        <CountryAccess
          countries={countries}
          query={countryQuery}
          onQuery={setCountryQuery}
          selected={settings.app.enabledCountries ?? []}
          onChange={(enabledCountries) =>
            setSettings({ ...settings, app: { ...settings.app, enabledCountries } })
          }
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.app.mapsEnabled}
            onChange={(event) =>
              setSettings({
                ...settings,
                app: { ...settings.app, mapsEnabled: event.target.checked },
              })
            }
          />
          Show maps in the traveler app
        </label>
      </section>
      <section className="grid gap-4">
        <h2 className="text-xl">API</h2>
        <Field label="Allowed browser origins">
          <textarea
            className={`${controlClass} min-h-28`}
            value={origins}
            onChange={(event) => setOrigins(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.api.contentPublished}
            onChange={(event) =>
              setSettings({
                ...settings,
                api: { ...settings.api, contentPublished: event.target.checked },
              })
            }
          />
          Publish stories on the public API
        </label>
      </section>
      <Notice error={error} saved={saved} />
    </form>
  );
}

function CountryAccess({
  countries,
  query,
  onQuery,
  selected,
  onChange,
}: {
  countries: { code: string; name: string }[];
  query: string;
  onQuery: (query: string) => void;
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const matches = countries
    .filter((country) => country.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((country) => !selected.includes(country.code))
    .slice(0, 6);

  return (
    <div className="grid gap-2">
      <Field label="Countries open for search">
        <input
          className={controlClass}
          value={query}
          placeholder="Search the country list"
          onChange={(event) => onQuery(event.target.value)}
        />
      </Field>
      {query.trim() && matches.length > 0 ? (
        <ul className="grid gap-1">
          {matches.map((country) => (
            <li key={country.code}>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => {
                  onChange([...selected, country.code]);
                  onQuery("");
                }}
              >
                Add {country.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {selected.map((code) => (
          <li key={code}>
            <button
              type="button"
              className="rounded-md bg-mist px-2 py-1 text-sm"
              onClick={() => onChange(selected.filter((item) => item !== code))}
            >
              {countries.find((country) => country.code === code)?.name ?? code} ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
