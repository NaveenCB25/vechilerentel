import { API_BASE_URL } from "./api";

export type LocationSuggestion = {
  label: string;
  subtitle: string;
};

export async function fetchLocationSuggestions(query: string) {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`${API_BASE_URL}/api/locations/search?${params.toString()}`);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success || !Array.isArray(data.suggestions)) {
    return [];
  }

  return data.suggestions as LocationSuggestion[];
}
