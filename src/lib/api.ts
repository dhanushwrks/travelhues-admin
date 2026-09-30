import type {
  CreatorInvite,
  Itinerary,
  Settings,
  Spot,
  SpotCatalogItem,
  Story,
  StoryDraft,
  WaitlistRequest,
} from "@/lib/types";

export const tokenKey = "travelhues-admin-token";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function readToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(tokenKey);
}

export async function signIn(token: string) {
  const response = await fetch(`${base}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError("That token was rejected", response.status);
  }
  saveToken(token);
}

export function saveToken(token: string) {
  sessionStorage.setItem(tokenKey, token);
  window.dispatchEvent(new Event("admin-session"));
}

export function clearToken() {
  sessionStorage.removeItem(tokenKey);
  window.dispatchEvent(new Event("admin-session"));
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readToken();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (response.status === 401) {
    clearToken();
    throw new ApiError("That token was rejected", 401);
  }
  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(" ");
    if (body.message) return body.message;
  } catch {
    return response.statusText;
  }
  return response.statusText;
}

export const adminApi = {
  settings: () => api<Settings>("/admin/settings"),
  saveSettings: (body: Settings) =>
    api<Settings>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  stories: () => api<Story[]>("/admin/stories"),
  story: (slug: string) => api<Story>(`/admin/stories/${slug}`),
  createStory: (body: StoryDraft) =>
    api<Story>("/admin/stories", { method: "POST", body: JSON.stringify(body) }),
  updateStory: (slug: string, body: StoryDraft) =>
    api<Story>(`/admin/stories/${slug}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteStory: (slug: string) =>
    api<void>(`/admin/stories/${slug}`, { method: "DELETE" }),
  createSpot: (slug: string, body: Spot) =>
    api<Spot>(`/admin/stories/${slug}/spots`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateSpot: (slug: string, spotId: string, body: Spot) =>
    api<Spot>(`/admin/stories/${slug}/spots/${spotId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteSpot: (slug: string, spotId: string) =>
    api<void>(`/admin/stories/${slug}/spots/${spotId}`, { method: "DELETE" }),
  createItinerary: (slug: string, body: Itinerary) =>
    api<Itinerary>(`/admin/stories/${slug}/itineraries`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateItinerary: (slug: string, itinerarySlug: string, body: Itinerary) =>
    api<Itinerary>(`/admin/stories/${slug}/itineraries/${itinerarySlug}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteItinerary: (slug: string, itinerarySlug: string) =>
    api<void>(`/admin/stories/${slug}/itineraries/${itinerarySlug}`, {
      method: "DELETE",
    }),
  waitlist: () => api<WaitlistRequest[]>("/admin/waitlist"),
  setWaitlistStatus: (id: string, status: "accepted" | "declined") =>
    api<WaitlistRequest>(`/admin/waitlist/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  invites: () => api<CreatorInvite[]>("/admin/invites"),
  createInvite: (body: { expiresInDays: number; waitlistId?: string }) =>
    api<CreatorInvite>("/admin/invites", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  revokeInvite: (token: string) =>
    api<void>(`/admin/invites/${token}`, { method: "DELETE" }),
  spotCatalog: () => api<SpotCatalogItem[]>("/admin/spot-catalog"),
  saveSpotCatalog: (body: SpotCatalogItem[]) =>
    api<SpotCatalogItem[]>("/admin/spot-catalog", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};
