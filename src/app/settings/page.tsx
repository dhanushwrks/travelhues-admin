"use client";

import Link from "next/link";
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

  useEffect(() => {
    let active = true;
    adminApi
      .settings()
      .then((next) => {
        if (!active) return;
        setSettings(withBrandLinks(next));
        setOrigins(next.api.corsOrigins.join("\n"));
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load settings");
      });
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
      setSettings(withBrandLinks(updated));
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
          <p className="max-w-md text-sm leading-6 text-ink/75">
            The name, maps, and whether stories are public. Countries live on their own page.
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
        <p className="text-sm">
          <Link href="/countries" className="underline">
            Countries
          </Link>{" "}
          decides where a creator can publish.
        </p>
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
        <h2 className="text-xl">Sign-in links</h2>
        <p className="max-w-md text-sm leading-6 text-ink/75">
          LinkedIn, Instagram, YouTube, Terms, and Policies on the sign-in page. Leave a field blank to hide it.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <BrandField
            label="LinkedIn"
            value={settings.app.linkedinUrl}
            onChange={(linkedinUrl) =>
              setSettings({ ...settings, app: { ...settings.app, linkedinUrl } })
            }
          />
          <BrandField
            label="Instagram"
            value={settings.app.instagramUrl}
            onChange={(instagramUrl) =>
              setSettings({ ...settings, app: { ...settings.app, instagramUrl } })
            }
          />
          <BrandField
            label="YouTube"
            value={settings.app.youtubeUrl}
            onChange={(youtubeUrl) =>
              setSettings({ ...settings, app: { ...settings.app, youtubeUrl } })
            }
          />
          <BrandField
            label="Terms"
            value={settings.app.termsUrl}
            onChange={(termsUrl) =>
              setSettings({ ...settings, app: { ...settings.app, termsUrl } })
            }
          />
          <BrandField
            label="Policies"
            value={settings.app.policiesUrl}
            onChange={(policiesUrl) =>
              setSettings({ ...settings, app: { ...settings.app, policiesUrl } })
            }
          />
        </div>
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

const brandLinkDefaults = {
  instagramUrl: "https://www.instagram.com/travelhues",
  linkedinUrl: "https://www.linkedin.com/company/travelhues",
  youtubeUrl: "https://www.youtube.com/@travelhues",
  termsUrl: "https://travelhues.com/terms",
  policiesUrl: "https://travelhues.com/policies",
};

function withBrandLinks(settings: Settings): Settings {
  const app = settings.app;
  return {
    ...settings,
    app: {
      ...app,
      instagramUrl: app.instagramUrl ?? brandLinkDefaults.instagramUrl,
      linkedinUrl: app.linkedinUrl ?? brandLinkDefaults.linkedinUrl,
      youtubeUrl: app.youtubeUrl ?? brandLinkDefaults.youtubeUrl,
      termsUrl: app.termsUrl ?? brandLinkDefaults.termsUrl,
      policiesUrl: app.policiesUrl ?? brandLinkDefaults.policiesUrl,
    },
  };
}

function BrandField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        className={controlClass}
        type="url"
        inputMode="url"
        value={value}
        placeholder="https://"
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
