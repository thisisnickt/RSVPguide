import axios from "axios";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const BASE_URL = "https://maps.googleapis.com/maps/api/place";

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  opening_hours?: {
    weekday_text: string[];
  };
}

export async function searchPlaces(query: string, location?: string): Promise<PlaceDetails[]> {
  const params: Record<string, string> = {
    query,
    key: GOOGLE_PLACES_API_KEY!,
    type: "establishment",
  };

  if (location) {
    params.location = location;
    params.radius = "10000";
  }

  const response = await axios.get(`${BASE_URL}/textsearch/json`, { params });
  return response.data.results ?? [];
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const fields = [
    "place_id",
    "name",
    "formatted_address",
    "formatted_phone_number",
    "website",
    "rating",
    "user_ratings_total",
    "geometry",
    "photos",
    "opening_hours",
  ].join(",");

  const response = await axios.get(`${BASE_URL}/details/json`, {
    params: {
      place_id: placeId,
      fields,
      key: GOOGLE_PLACES_API_KEY!,
    },
  });

  return response.data.result ?? null;
}

export function getPhotoUrl(photoReference: string, maxWidth = 800): string {
  return `${BASE_URL}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}
