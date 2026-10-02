export const spotTypes = [
  "stay",
  "food",
  "activity",
  "sightseeing",
  "shop",
] as const;

export type SpotType = (typeof spotTypes)[number];

export type SpotCatalogItem = {
  slug: string;
  label: string;
  kinds: string[];
};

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
    instagramUrl: string;
    linkedinUrl: string;
    youtubeUrl: string;
    termsUrl: string;
    policiesUrl: string;
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

export const flightDealOrigins = ["BLR", "BOM", "HYD", "DEL", "MAA"] as const;

export type FlightDealStatus = "draft" | "published" | "archived";

export type FlightDeal = {
  id: string;
  originIata: string;
  destinationIata: string;
  destinationCity: string;
  destinationCountry: string;
  departureDate: string;
  returnDate: string;
  priceInr: number;
  currency: string;
  affiliateUrl: string;
  affiliatePartner: string;
  headline: string;
  subtitle: string;
  badge: string;
  storyCreatorUsername: string;
  storySlug: string;
  featuredItinerarySlug: string;
  featuredSpotIds: string[];
  status: FlightDealStatus;
  validFrom: string;
  validUntil: string;
  priority: number;
  externalId: string;
  createdAt: string;
  updatedAt: string;
};

export type FlightDealImportResult = {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
};

export type FlightDealStorySuggestion = {
  storySlug: string;
  storyCreatorUsername: string;
  title: string;
  destination: string;
  country: string;
};
