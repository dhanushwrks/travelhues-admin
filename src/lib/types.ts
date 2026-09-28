export const spotTypes = [
  "stay",
  "food",
  "activity",
  "sightseeing",
  "shop",
] as const;

export type SpotType = (typeof spotTypes)[number];

export type Spot = {
  id: string;
  type: SpotType;
  title: string;
  description: string;
  images: string[];
  lat: number;
  lng: number;
  address: string;
  avgMinutes: number;
  avgCostThb: number;
  tags: string[];
};

export type NoteBlock = { kind: "note"; body: string };
export type SpotBlock = { kind: "spot"; spotId: string; body: string };
export type Block = NoteBlock | SpotBlock;

export type Day = { title: string; blocks: Block[] };

export type Itinerary = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  days: Day[];
};

export type Creator = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
};

export type Destination = {
  name: string;
  country: string;
  lat: number;
  lng: number;
};

export type Story = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  destination: Destination;
  creator: Creator;
  spots: Spot[];
  itineraries: Itinerary[];
};

export type Settings = {
  app: {
    name: string;
    tagline: string;
    publicUrl: string;
    mapsEnabled: boolean;
    enabledCountries: string[];
  };
  api: {
    corsOrigins: string[];
    contentPublished: boolean;
  };
};

export type WaitlistRequest = {
  id: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  name: string;
  country: string;
  dateOfBirth: string;
  socials: { platform: string; url: string }[];
  handle: string;
  bio: string;
  hobbies: string[];
  countriesTraveled: string[];
};

export type CreatorInvite = {
  token: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  waitlistId: string | null;
  url?: string;
};

export type StoryDraft = {
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  destination: Destination;
  creator: Creator;
};
