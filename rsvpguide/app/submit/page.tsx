import type { Metadata } from "next";
import SubmissionForm from "@/components/SubmissionForm";

export const metadata: Metadata = {
  title: "List Your Venue",
  description:
    "Submit your bar, club or rooftop venue to RSVPguide's curated Singapore nightlife directory.",
};

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C9A84C]">
          For venue owners
        </p>
        <h1 className="mt-2 font-playfair text-4xl font-bold leading-tight text-[#F0EDE6]">
          List your venue on RSVPguide
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#A89F8C]">
          Reach Singapore&apos;s most engaged nightlife community. Listings are
          curated — we&apos;ll review your submission within 48 hours.
        </p>
      </div>

      <SubmissionForm />
    </div>
  );
}
