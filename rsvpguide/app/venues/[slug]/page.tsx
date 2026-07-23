interface VenuePageProps {
  params: { slug: string };
}

export default function VenuePage({ params }: VenuePageProps) {
  return (
    <main>
      <h1>Venue: {params.slug}</h1>
    </main>
  );
}
