"use client";

import { FiSearch } from "react-icons/fi";
import type { VenueCategory } from "@/lib/types";

// Category pills — display label maps to the DB enum value
const CATEGORY_PILLS: { label: string; value: VenueCategory | "" }[] = [
  { label: "All",              value: "" },
  { label: "Dance Clubs",      value: "Dance Club" },
  { label: "Cocktail Bars",    value: "Cocktail Bar" },
  { label: "Rooftop Bars",     value: "Rooftop Bar" },
  { label: "Pubs & Breweries", value: "Pub / Brewery" },
];

const NEIGHBOURHOODS = [
  "Clarke Quay",
  "Marina Bay",
  "Tanjong Pagar",
  "Amoy Street",
  "Bukit Pasoh",
  "Boat Quay",
  "CBD",
  "City Hall",
  "Orchard",
  "Bugis",
  "Chinatown",
  "Club Street",
  "Duxton",
  "Bras Basah",
] as const;

interface FilterBarProps {
  activeCategory: VenueCategory | "";
  activeNeighbourhood: string;
  onCategoryChange: (value: VenueCategory | "") => void;
  onNeighbourhoodChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  resultCount: number;
}

export default function FilterBar({
  activeCategory,
  activeNeighbourhood,
  onCategoryChange,
  onNeighbourhoodChange,
  onSearchChange,
  resultCount,
}: FilterBarProps) {
  return (
    // sticky top-14 = sits flush below the 56px header
    <div className="sticky top-14 z-40 border-b border-[#2A2A2A] bg-[#0D0D0D]/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">

          {/* ── Category pills ── */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PILLS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => onCategoryChange(value)}
                className={`rounded-full border px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider transition-all duration-200 ${
                  activeCategory === value
                    ? "border-[#C9A84C] bg-[#C9A84C] text-[#0D0D0D]"
                    : "border-[#2A2A2A] text-[#A89F8C] hover:border-[#C9A84C]/50 hover:text-[#F0EDE6]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Right controls ── */}
          <div className="flex flex-1 flex-wrap items-center gap-3">

            {/* Neighbourhood dropdown */}
            <select
              value={activeNeighbourhood}
              onChange={(e) => onNeighbourhoodChange(e.target.value)}
              className="rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] px-3 py-1.5 text-[12px] text-[#A89F8C] outline-none transition-colors focus:border-[#C9A84C]/50 focus:text-[#F0EDE6]"
            >
              <option value="">All Neighbourhoods</option>
              {NEIGHBOURHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* Search input */}
            <div className="relative flex-1 min-w-[160px]">
              <FiSearch
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89F8C]"
              />
              <input
                type="text"
                placeholder="Search venues…"
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-[#2A2A2A] bg-[#1C1C1C] py-1.5 pl-8 pr-3 text-[12px] text-[#F0EDE6] placeholder-[#A89F8C] outline-none transition-colors focus:border-[#C9A84C]/50"
              />
            </div>

            {/* Result count */}
            <p className="flex-shrink-0 text-[12px] text-[#A89F8C]">
              Showing{" "}
              <span className="text-[#F0EDE6]">{resultCount}</span>{" "}
              venue{resultCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
