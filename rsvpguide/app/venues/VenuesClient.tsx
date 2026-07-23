"use client";

import { useMemo, useState } from "react";
import FilterBar from "@/components/FilterBar";
import VenueGrid from "@/components/VenueGrid";
import type { Venue, VenueCategory } from "@/lib/types";

interface VenuesClientProps {
  initialVenues: Venue[];
}

export default function VenuesClient({ initialVenues }: VenuesClientProps) {
  const [activeCategory,      setActiveCategory]      = useState<VenueCategory | "">("");
  const [activeNeighbourhood, setActiveNeighbourhood] = useState("");
  const [search,              setSearch]              = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialVenues.filter((v) => {
      if (activeCategory && v.category !== activeCategory) return false;
      if (activeNeighbourhood && v.neighbourhood !== activeNeighbourhood) return false;
      if (q) {
        return (
          v.name.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          v.neighbourhood.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [initialVenues, activeCategory, activeNeighbourhood, search]);

  return (
    <>
      <FilterBar
        activeCategory={activeCategory}
        activeNeighbourhood={activeNeighbourhood}
        onCategoryChange={setActiveCategory}
        onNeighbourhoodChange={setActiveNeighbourhood}
        onSearchChange={setSearch}
        resultCount={filtered.length}
      />
      <div className="mt-6">
        <VenueGrid venues={filtered} />
      </div>
    </>
  );
}
