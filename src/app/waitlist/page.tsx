"use client";

import { useEffect, useState } from "react";

import { Notice, PrimaryButton } from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { CreatorInvite, WaitlistRequest } from "@/lib/types";

const views = [
  { id: "pending", label: "Waiting" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
] as const;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function WaitlistPage() {
  const [requests, setRequests] = useState<WaitlistRequest[] | null>(null);
  const [invites, setInvites] = useState<CreatorInvite[] | null>(null);
  const [view, setView] = useState<(typeof views)[number]["id"]>("pending");
  const [days, setDays] = useState("7");
  const [countryNames, setCountryNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function reload() {
    const [nextRequests, nextInvites] = await Promise.all([adminApi.waitlist(), adminApi.invites()]);
    setRequests(nextRequests);
    setInvites(nextInvites);
  }

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.waitlist(), adminApi.invites()])
      .then(([nextRequests, nextInvites]) => {
        if (!active) return;
        setRequests(nextRequests);
        setInvites(nextInvites);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load the waitlist");
      });
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/countries`)
      .then((response) => (response.ok ? response.json() : []))
      .then((countries: { code: string; name: string }[]) => {
        if (active) setCountryNames(new Map(countries.map((country) => [country.code, country.name])));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function run(action: () => Promise<void>, message: string) {
    setError("");
    setSaved("");
    try {
      await action();
      await reload();
      setSaved(message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update");
    }
  }

  const visible = requests?.filter((request) => request.status === view) ?? [];

  return (
    <div className="grid gap-10">
      <div className="grid gap-1">
        <h1 className="text-3xl font-medium tracking-tight">Waitlist</h1>
        <p className="max-w-md text-sm leading-6 text-ink/75">
          Read a request, accept it, then send a link that expires. That link is how a creator opens
          an account.
        </p>
      </div>
      <Notice error={error} saved={saved} />
      <div className="flex gap-5 text-sm">
        {views.map((item) => {
          const count = requests?.filter((request) => request.status === item.id).length ?? 0;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={active ? "text-ink" : "text-ink/50"}
              onClick={() => setView(item.id)}
            >
              {item.label}
              {requests ? ` ${count}` : ""}
            </button>
          );
        })}
      </div>
      {requests === null ? (
        <p className="text-sm">Loading requests</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink/70">{emptyCopy(view)}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {visible.map((request) => (
            <li key={request.id} className="grid gap-3 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg">{request.name}</h2>
                <span className="text-sm text-ink/70">{statusLabel(request.status)}</span>
              </div>
              <p className="text-sm text-ink/75">
                @{request.handle} · {countryNames.get(request.country) ?? request.country} · born{" "}
                {formatDate(request.dateOfBirth)}
              </p>
              <p className="max-w-lg text-sm leading-6">{request.bio}</p>
              <ul className="grid gap-1 text-sm">
                {request.socials.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} className="underline" target="_blank" rel="noreferrer">
                      {linkLabel(link.url)}
                    </a>
                  </li>
                ))}
              </ul>
              {request.hobbies.length > 0 ? (
                <p className="text-sm text-ink/75">{request.hobbies.join(", ")}</p>
              ) : null}
              {request.status === "pending" ? (
                <div className="flex items-center gap-4">
                  <PrimaryButton
                    type="button"
                    onClick={() =>
                      void run(
                        () => adminApi.setWaitlistStatus(request.id, "accepted").then(() => undefined),
                        "Request accepted",
                      )
                    }
                  >
                    Accept
                  </PrimaryButton>
                  <button
                    type="button"
                    className="text-sm text-ink/70"
                    onClick={() =>
                      void run(
                        () => adminApi.setWaitlistStatus(request.id, "declined").then(() => undefined),
                        "Request declined",
                      )
                    }
                  >
                    Decline
                  </button>
                </div>
              ) : null}
              {request.status === "accepted" ? (
                <InviteButton
                  days={days}
                  onDays={setDays}
                  onCreate={() =>
                    void run(async () => {
                      const invite = await adminApi.createInvite({
                        expiresInDays: Number(days),
                        waitlistId: request.id,
                      });
                      await copyInvite(invite.url);
                    }, "Invite copied")
                  }
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-xl font-medium">Invite links</h2>
            <p className="text-sm text-ink/70">A link can also be sent without a request.</p>
          </div>
          <InviteButton
            days={days}
            onDays={setDays}
            onCreate={() =>
              void run(async () => {
                const invite = await adminApi.createInvite({ expiresInDays: Number(days) });
                await copyInvite(invite.url);
              }, "Invite copied")
            }
          />
        </div>
        {invites === null ? null : invites.length === 0 ? (
          <p className="text-sm text-ink/70">No links yet.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {invites.map((invite) => (
              <li key={invite.token} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p>{inviteState(invite)}</p>
                  <p className="text-ink/70">Expires {formatDate(invite.expiresAt.slice(0, 10))}</p>
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="text-ink/80"
                    onClick={() => {
                      void copyInvite(invite.url).then(() => setSaved("Invite copied"));
                    }}
                  >
                    Copy
                  </button>
                  {invite.usedAt ? null : (
                    <button
                      type="button"
                      className="text-red"
                      onClick={() => void run(() => adminApi.revokeInvite(invite.token), "Invite revoked")}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function InviteButton({
  days,
  onDays,
  onCreate,
}: {
  days: string;
  onDays: (days: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink"
        value={days}
        onChange={(event) => onDays(event.target.value)}
      >
        <option value="3">3 days</option>
        <option value="7">7 days</option>
        <option value="14">14 days</option>
        <option value="30">30 days</option>
      </select>
      <PrimaryButton type="button" onClick={onCreate}>
        Create invite
      </PrimaryButton>
    </div>
  );
}

async function copyInvite(url: string | undefined) {
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    return;
  }
}

function statusLabel(status: WaitlistRequest["status"]) {
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return "Waiting";
}

function emptyCopy(view: (typeof views)[number]["id"]) {
  if (view === "accepted") return "No accepted requests.";
  if (view === "declined") return "No declined requests.";
  return "No one is waiting.";
}

function inviteState(invite: CreatorInvite) {
  if (invite.usedAt) return "Used";
  if (Date.parse(invite.expiresAt) <= Date.now()) return "Expired";
  return "Open";
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const month = months[Number(match[2]) - 1];
  if (!month) return value;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

function linkLabel(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return url;
  }
}
