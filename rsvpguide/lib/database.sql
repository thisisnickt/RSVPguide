-- ============================================================
-- RSVPGuide Database Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- needed for gen_random_uuid() on older PG versions


-- ============================================================
-- TABLES
-- ============================================================

-- ------------------------------------------------------------
-- 1. venues
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text          NOT NULL,
  slug                text          UNIQUE NOT NULL,
  category            text          NOT NULL
                                    CHECK (category IN (
                                      'Dance Club',
                                      'Cocktail Bar',
                                      'Rooftop Bar',
                                      'Pub / Brewery'
                                    )),
  neighbourhood       text          NOT NULL,
  address             text,
  phone               text,
  website             text,
  booking_url         text,
  hours               text,
  description         text,           -- editorial write-up, 2-3 sentences
  signature_drinks    text,           -- comma-separated list
  entertainment       text,           -- programming / events format
  known_promotions    text,
  instagram           text,
  google_place_id     text,           -- Google Places API photo fetching
  photo_url           text,           -- fallback photo URL
  is_featured         boolean       NOT NULL DEFAULT false,   -- paid featured listing
  is_verified         boolean       NOT NULL DEFAULT true,
  is_active           boolean       NOT NULL DEFAULT true,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  venues               IS 'Venue directory for RSVPGuide';
COMMENT ON COLUMN venues.slug          IS 'URL-friendly identifier, e.g. ''atlas-bar''';
COMMENT ON COLUMN venues.category      IS 'Dance Club | Cocktail Bar | Rooftop Bar | Pub / Brewery';
COMMENT ON COLUMN venues.is_featured   IS 'Paid featured placement on listings page';
COMMENT ON COLUMN venues.google_place_id IS 'Used to fetch photos via Google Places API';


-- ------------------------------------------------------------
-- 2. events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            uuid          REFERENCES venues (id) ON DELETE CASCADE,
  title               text          NOT NULL,
  description         text,
  event_date          date          NOT NULL,
  start_time          time,
  end_time            time,
  is_recurring        boolean       NOT NULL DEFAULT false,
  recurrence_pattern  text,          -- e.g. 'weekly-wednesday', 'weekly-friday'
  ticket_url          text,
  ticket_price        text,          -- e.g. 'Free', 'From S$35', 'S$58 pp'
  performer_name      text,
  performer_type      text
                                    CHECK (performer_type IN (
                                      'DJ',
                                      'Live Band',
                                      'Artist',
                                      'Other'
                                    )),
  source              text,          -- where the event data was sourced from
  is_active           boolean       NOT NULL DEFAULT true,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  events                     IS 'Events and programming at RSVPGuide venues';
COMMENT ON COLUMN events.recurrence_pattern  IS 'Freeform pattern key, e.g. ''weekly-friday''';
COMMENT ON COLUMN events.ticket_price        IS 'Human-readable price string, e.g. ''From S$35''';
COMMENT ON COLUMN events.performer_type      IS 'DJ | Live Band | Artist | Other';


-- ------------------------------------------------------------
-- 3. submissions (venue self-submission form)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_name          text          NOT NULL,
  contact_name        text          NOT NULL,
  contact_email       text          NOT NULL,
  venue_website       text,
  venue_category      text,
  venue_neighbourhood text,
  message             text,
  status              text          NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at          timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE  submissions        IS 'Venue self-submission requests awaiting review';
COMMENT ON COLUMN submissions.status IS 'pending | approved | rejected';


-- ------------------------------------------------------------
-- 4. digest_subscribers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digest_subscribers (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text          UNIQUE NOT NULL,
  name            text,
  is_active       boolean       NOT NULL DEFAULT true,
  subscribed_at   timestamptz   NOT NULL DEFAULT now()
);

COMMENT ON TABLE digest_subscribers IS 'Weekly digest email subscribers';


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_venues_category     ON venues (category);
CREATE INDEX IF NOT EXISTS idx_venues_neighbourhood ON venues (neighbourhood);
CREATE INDEX IF NOT EXISTS idx_venues_slug          ON venues (slug);
CREATE INDEX IF NOT EXISTS idx_venues_is_featured   ON venues (is_featured);

CREATE INDEX IF NOT EXISTS idx_events_venue_id     ON events (venue_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date   ON events (event_date);


-- ============================================================
-- updated_at TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_venues_updated_at ON venues;
CREATE TRIGGER trg_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE venues              ENABLE ROW LEVEL SECURITY;
ALTER TABLE events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE digest_subscribers  ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- venues policies
-- ------------------------------------------------------------

-- Anyone (including anonymous visitors) can read active venues.
CREATE POLICY "venues: public read active"
  ON venues
  FOR SELECT
  USING (is_active = true);

-- Only the service role (server-side API) can insert new venues.
CREATE POLICY "venues: service role insert"
  ON venues
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only the service role can update venues.
CREATE POLICY "venues: service role update"
  ON venues
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only the service role can delete venues.
CREATE POLICY "venues: service role delete"
  ON venues
  FOR DELETE
  USING (auth.role() = 'service_role');


-- ------------------------------------------------------------
-- events policies
-- ------------------------------------------------------------

-- Anyone can read active events.
CREATE POLICY "events: public read active"
  ON events
  FOR SELECT
  USING (is_active = true);

-- Only the service role can insert events.
CREATE POLICY "events: service role insert"
  ON events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only the service role can update events.
CREATE POLICY "events: service role update"
  ON events
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only the service role can delete events.
CREATE POLICY "events: service role delete"
  ON events
  FOR DELETE
  USING (auth.role() = 'service_role');


-- ------------------------------------------------------------
-- submissions policies
-- ------------------------------------------------------------

-- Anyone can submit a listing request (the public-facing form).
CREATE POLICY "submissions: public insert"
  ON submissions
  FOR INSERT
  WITH CHECK (true);

-- Only the service role (admin) can read submissions.
CREATE POLICY "submissions: service role select"
  ON submissions
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Only the service role can update a submission's status.
CREATE POLICY "submissions: service role update"
  ON submissions
  FOR UPDATE
  USING (auth.role() = 'service_role');


-- ------------------------------------------------------------
-- digest_subscribers policies
-- ------------------------------------------------------------

-- Anyone can subscribe (insert their own row).
CREATE POLICY "digest_subscribers: public insert"
  ON digest_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only the service role can read the full subscriber list.
CREATE POLICY "digest_subscribers: service role select"
  ON digest_subscribers
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Only the service role can update subscriber records (e.g. deactivate).
CREATE POLICY "digest_subscribers: service role update"
  ON digest_subscribers
  FOR UPDATE
  USING (auth.role() = 'service_role');
