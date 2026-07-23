// ============================================================
// RSVPGuide — TypeScript types matching the Supabase schema
// (lib/database.sql)
// ============================================================

export type VenueCategory =
  | "Dance Club"
  | "Cocktail Bar"
  | "Rooftop Bar"
  | "Pub / Brewery";

export type PerformerType = "DJ" | "Live Band" | "Artist" | "Other";

export type SubmissionStatus = "pending" | "approved" | "rejected";

// ------------------------------------------------------------
// venues
// ------------------------------------------------------------
export interface Venue {
  id: string;
  name: string;
  slug: string;
  category: VenueCategory;
  neighbourhood: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  hours: string | null;
  description: string | null;
  signature_drinks: string | null;
  entertainment: string | null;
  known_promotions: string | null;
  instagram: string | null;
  google_place_id: string | null;
  photo_url: string | null;
  is_featured: boolean;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Convenience type for creating a new venue (omit server-generated fields and
// fields with DB defaults so they don't have to be specified on every insert)
export type VenueInsert = Omit<
  Venue,
  "id" | "created_at" | "updated_at" | "is_featured" | "is_verified" | "is_active"
> & {
  is_featured?: boolean;
  is_verified?: boolean;
  is_active?: boolean;
};

export type VenueUpdate = Partial<VenueInsert>;

// ------------------------------------------------------------
// events
// ------------------------------------------------------------
export interface Event {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  event_date: string;        // ISO date string, e.g. "2025-08-15"
  start_time: string | null; // HH:MM:SS, e.g. "21:00:00"
  end_time: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  ticket_url: string | null;
  ticket_price: string | null; // human-readable, e.g. "From S$35"
  performer_name: string | null;
  performer_type: PerformerType | null;
  source: string | null;
  is_active: boolean;
  created_at: string;
  // Joined relation — populated when fetched with `venue:venues(*)`
  venue?: Venue;
}

export type EventInsert = Omit<Event, "id" | "created_at" | "venue"> & {
  is_recurring?: boolean;
  is_active?: boolean;
};

export type EventUpdate = Partial<EventInsert>;

// ------------------------------------------------------------
// submissions
// ------------------------------------------------------------
export interface Submission {
  id: string;
  venue_name: string;
  contact_name: string;
  contact_email: string;
  venue_website: string | null;
  venue_category: string | null;
  venue_neighbourhood: string | null;
  message: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export type SubmissionInsert = Omit<Submission, "id" | "created_at" | "status"> & {
  status?: SubmissionStatus;
};

export type SubmissionUpdate = Partial<Pick<Submission, "status">>;

// ------------------------------------------------------------
// digest_subscribers
// ------------------------------------------------------------
export interface DigestSubscriber {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  subscribed_at: string;
}

export type DigestSubscriberInsert = Omit<
  DigestSubscriber,
  "id" | "subscribed_at"
> & {
  is_active?: boolean;
};

// ------------------------------------------------------------
// Google Places API
// ------------------------------------------------------------

/**
 * Normalised result returned by getVenueDetails() in lib/googlePlaces.ts.
 * All optional fields are null when the Places API did not return them.
 */
export interface GooglePlaceResult {
  /** Google's stable place identifier */
  place_id: string;
  /** Full street address as returned by Google */
  formatted_address: string | null;
  /** International-format phone number, e.g. "+65 6336 0797" */
  formatted_phone_number: string | null;
  /** Array of human-readable opening-hours lines, one per weekday */
  opening_hours: string[] | null;
  /** Aggregate star rating (1–5) */
  rating: number | null;
  /** Venue's own website URL */
  website: string | null;
  /** Place Photo URL at 800 px width (via Google Places Photo API) */
  photo_url: string | null;
}

// ------------------------------------------------------------
// Shared utility types
// ------------------------------------------------------------
export interface FilterOptions {
  category?: VenueCategory;
  neighbourhood?: string;
  date?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  count?: number;
}
