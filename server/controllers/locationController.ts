import type { Request, Response } from "express";

import { getFrontendUrl } from "../lib/runtimeConfig.ts";

type LocationSuggestion = {
  label: string;
  subtitle: string;
};

const FALLBACK_LOCATIONS: LocationSuggestion[] = [
  { label: "Kempegowda International Airport", subtitle: "Bengaluru, Karnataka" },
  { label: "Majestic", subtitle: "Bengaluru, Karnataka" },
  { label: "Electronic City", subtitle: "Bengaluru, Karnataka" },
  { label: "Whitefield", subtitle: "Bengaluru, Karnataka" },
  { label: "Koramangala", subtitle: "Bengaluru, Karnataka" },
  { label: "Indiranagar", subtitle: "Bengaluru, Karnataka" },
  { label: "MG Road", subtitle: "Bengaluru, Karnataka" },
  { label: "Chhatrapati Shivaji Maharaj International Airport", subtitle: "Mumbai, Maharashtra" },
  { label: "Bandra", subtitle: "Mumbai, Maharashtra" },
  { label: "Andheri", subtitle: "Mumbai, Maharashtra" },
  { label: "Connaught Place", subtitle: "New Delhi, Delhi" },
  { label: "Indira Gandhi International Airport", subtitle: "New Delhi, Delhi" },
  { label: "Gachibowli", subtitle: "Hyderabad, Telangana" },
  { label: "HITEC City", subtitle: "Hyderabad, Telangana" },
  { label: "Chennai Central", subtitle: "Chennai, Tamil Nadu" },
];

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function getFallbackSuggestions(query: string) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  return FALLBACK_LOCATIONS.filter(
    (item) =>
      item.label.toLowerCase().includes(normalizedQuery) ||
      item.subtitle.toLowerCase().includes(normalizedQuery),
  ).slice(0, 5);
}

export const searchLocations = async (req: Request, res: Response): Promise<any> => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q : "";
  const query = rawQuery.trim();

  if (query.length < 2) {
    return res.json({ success: true, suggestions: [] });
  }

  const fallbackSuggestions = getFallbackSuggestions(query);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "5",
      countrycodes: "in",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "vrms-pro-location-search/1.0",
        Referer: getFrontendUrl(),
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ success: true, suggestions: fallbackSuggestions });
    }

    const data = (await response.json()) as Array<{
      name?: string;
      display_name?: string;
      address?: {
        suburb?: string;
        city_district?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
      };
    }>;

    const suggestions = data
      .map((item) => {
        const label = item.name?.trim() || item.display_name?.split(",")[0]?.trim() || "";
        const subtitleParts = [
          item.address?.suburb,
          item.address?.city_district,
          item.address?.city || item.address?.town || item.address?.village,
          item.address?.state,
        ].filter(Boolean);

        const subtitle = subtitleParts.join(", ") || item.display_name || "";

        if (!label || !subtitle) {
          return null;
        }

        return { label, subtitle };
      })
      .filter((item, index, list): item is LocationSuggestion => {
        if (!item) {
          return false;
        }

        return list.findIndex((candidate) => candidate?.label === item.label && candidate?.subtitle === item.subtitle) === index;
      });

    return res.json({
      success: true,
      suggestions: suggestions.length > 0 ? suggestions : fallbackSuggestions,
    });
  } catch {
    return res.json({ success: true, suggestions: fallbackSuggestions });
  }
};
