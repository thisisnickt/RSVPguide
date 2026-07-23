"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FilterOptions, VenueCategory } from "@/lib/types";

const CATEGORIES: VenueCategory[] = [
  "Dance Club",
  "Cocktail Bar",
  "Rooftop Bar",
  "Pub / Brewery",
];

interface FilterBarProps {
  filters: FilterOptions;
}

export default function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-border bg-brand-card p-4">
      <input
        type="text"
        placeholder="Search venues..."
        defaultValue={filters.search ?? ""}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="min-w-[200px] flex-1 rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-gold"
      />
      <select
        value={filters.category ?? ""}
        onChange={(e) => updateFilter("category", e.target.value)}
        className="rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-gold"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Neighbourhood..."
        defaultValue={filters.neighbourhood ?? ""}
        onChange={(e) => updateFilter("neighbourhood", e.target.value)}
        className="w-44 rounded border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-gold"
      />
    </div>
  );
}
