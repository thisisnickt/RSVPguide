export interface Venue {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  capacity?: number;
  categories: string[];
  amenities: string[];
  google_place_id?: string;
  google_rating?: number;
  google_reviews_count?: number;
  latitude?: number;
  longitude?: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  venue_id: string;
  venue?: Venue;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time?: string;
  ticket_price?: number;
  ticket_url?: string;
  image_url?: string;
  categories: string[];
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  type: "venue" | "event";
  name: string;
  email: string;
  venue_name?: string;
  venue_address?: string;
  event_title?: string;
  event_date?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface FilterOptions {
  category?: string;
  city?: string;
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
