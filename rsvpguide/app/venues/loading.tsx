export default function VenuesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Page header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-full bg-[#C9A84C]/30" />
        <div className="h-9 w-48 animate-pulse rounded bg-[#1C1C1C]" />
        <div className="h-4 w-64 animate-pulse rounded bg-[#1C1C1C]" />
      </div>

      {/* FilterBar skeleton */}
      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-[#2A2A2A] bg-[#141414] p-4">
        {[80, 110, 115, 105, 130].map((w) => (
          <div
            key={w}
            style={{ width: w }}
            className="h-7 animate-pulse rounded-full bg-[#1C1C1C]"
          />
        ))}
        <div className="ml-auto h-7 w-40 animate-pulse rounded-lg bg-[#1C1C1C]" />
        <div className="h-7 w-48 animate-pulse rounded-lg bg-[#1C1C1C]" />
      </div>

      {/* Venue card grid skeleton */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414]"
          >
            {/* Photo area */}
            <div className="h-52 animate-pulse bg-gradient-to-br from-[#1C1C1C] to-[#141414]" />
            {/* Body */}
            <div className="space-y-2 p-4">
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-[#1C1C1C]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#1C1C1C]" />
              <div className="space-y-1.5 pt-1">
                <div className="h-3.5 w-full animate-pulse rounded bg-[#1C1C1C]" />
                <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#1C1C1C]" />
              </div>
              <div className="flex gap-1.5 pt-1">
                <div className="h-5 w-24 animate-pulse rounded-full bg-[#1C1C1C]" />
              </div>
            </div>
            {/* Buttons */}
            <div className="flex gap-2 px-4 pb-4">
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-[#1C1C1C]" />
              <div className="h-8 flex-1 animate-pulse rounded-lg bg-[#1C1C1C]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
