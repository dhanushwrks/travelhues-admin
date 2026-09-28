"use client";

import { useEffect, useState } from "react";

import { Notice, PrimaryButton, controlClass } from "@/components/fields";
import { adminApi } from "@/lib/api";
import type { CreatorInvite, WaitlistRequest } from "@/lib/types";

export default function CreatorsPage() {
  const [requests, setRequests] = useState<WaitlistRequest[] | null>(null);
  const [invites, setInvites] = useState<CreatorInvite[] | null>(null);
  const [days, setDays] = useState("7");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function reload() {
    const [nextRequests, nextInvites] = await Promise.all([
      adminApi.waitlist(),
      adminApi.invites(),
    ]);
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
        if (active) setError(caught instanceof Error ? caught.message : "Could not load creators");
      });
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

  return (
    <div className="grid gap-10">
      <div className="grid gap-1">
        <h1 className="text-3xl font-medium tracking-tight">Creators</h1>
        <p className="max-w-lg text-sm text-ink/75">
          Review waitlist requests, then send a link that expires. The link is how a creator opens an account.
        </p>
      </div>
      <Notice error={error} saved={saved} />
      <section className="grid gap-4">
        <h2 className="text-xl font-medium">Requests</h2>
        {requests === null ? (
          <p className="text-sm text-ink/70">Loading requests</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-ink/70">No one is waiting.</p>
        ) : (
          <ul className="grid gap-4">
            {requests.map((request) => (
              <li key={request.id} className="grid gap-3 border border-line bg-paper p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg">{request.name}</h3>
                  <span className="text-sm text-ink/70">{labelStatus(request.status)}</span>
                </div>
                <p className="text-sm">@{request.handle}</p>
                <p className="text-sm text-ink/75">{request.bio}</p>
                <p className="text-sm">
                  {request.country} · born {request.dateOfBirth}
                </p>
                <ul className="grid gap-1 text-sm">
                  {request.socials.map((link) => (
                    <li key={link.url}>
                      <a href={link.url} className="underline" target="_blank" rel="noreferrer">
                        {link.platform}
                      </a>
                    </li>
                  ))}
                </ul>
                {request.hobbies.length > 0 ? (
                  <p className="text-sm">{request.hobbies.join(", ")}</p>
                ) : null}
                {request.status === "pending" ? (
                  <div className="flex gap-3">
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
                      className="text-sm underline"
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
                      }, "Invite ready")
                    }
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-medium">Invite links</h2>
          <InviteButton
            days={days}
            onDays={setDays}
            onCreate={() =>
              void run(async () => {
                const invite = await adminApi.createInvite({ expiresInDays: Number(days) });
                await copyInvite(invite.url);
              }, "Invite ready")
            }
          />
        </div>
        {invites === null ? null : invites.length === 0 ? (
          <p className="text-sm text-ink/70">No links yet.</p>
        ) : (
          <ul className="grid gap-3">
            {invites.map((invite) => (
              <li key={invite.token} className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-4 py-3 text-sm">
                <div>
                  <p>{inviteState(invite)}</p>
                  <p className="text-ink/70">Expires {invite.expiresAt.slice(0, 10)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="underline"
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
      <select className={controlClass} value={days} onChange={(event) => onDays(event.target.value)}>
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

function labelStatus(status: WaitlistRequest["status"]) {
  if (status === "accepted") return "Accepted";
  if (status === "declined") return "Declined";
  return "Pending";
}

function inviteState(invite: CreatorInvite) {
  if (invite.usedAt) return "Used";
  if (Date.parse(invite.expiresAt) <= Date.now()) return "Expired";
  return "Open";
}
