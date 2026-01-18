-- schema.sql
-- PostgreSQL schema + seed data for demo

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS airports;
DROP TABLE IF EXISTS passengers;

CREATE TABLE passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  loyalty_points INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE airports (
  code CHAR(3) PRIMARY KEY,
  city TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number TEXT NOT NULL,
  origin_code CHAR(3) NOT NULL REFERENCES airports(code),
  destination_code CHAR(3) NOT NULL REFERENCES airports(code),
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time   TIMESTAMPTZ NOT NULL,
  boarding_gate TEXT
);

CREATE TABLE bookings (
  pnr_reference CHAR(6) PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES passengers(id),
  flight_id UUID NOT NULL REFERENCES flights(id),
  status TEXT NOT NULL CHECK (status IN ('CONFIRMED','CANCELLED','FLOWN','PENDING'))
);

-- Seed airports
INSERT INTO airports (code, city, country) VALUES
  ('MEL', 'Melbourne', 'Australia'),
  ('SYD', 'Sydney', 'Australia'),
  ('BNE', 'Brisbane', 'Australia')
ON CONFLICT DO NOTHING;

-- Seed passenger (Joseph persona)
INSERT INTO passengers (id, first_name, last_name, loyalty_points)
VALUES
  ('6e6e6cf1-9e50-4a4e-9d8b-3aa8b4c4e3a1', 'Joseph', 'Nightingale', 48399)
ON CONFLICT (id) DO NOTHING;

-- Seed flight
INSERT INTO flights (id, flight_number, origin_code, destination_code, departure_time, arrival_time, boarding_gate)
VALUES
  ('2f3d2e21-9b6f-4a8a-88d2-24d8704fe2b0', 'VA801', 'MEL', 'SYD',
   '2026-01-21T09:15:00+11:00', '2026-01-21T10:40:00+11:00', '12')
ON CONFLICT (id) DO NOTHING;

-- Seed booking (valid retrieval)
INSERT INTO bookings (pnr_reference, passenger_id, flight_id, status)
VALUES
  ('AB12CD', '6e6e6cf1-9e50-4a4e-9d8b-3aa8b4c4e3a1', '2f3d2e21-9b6f-4a8a-88d2-24d8704fe2b0', 'CONFIRMED')
ON CONFLICT (pnr_reference) DO NOTHING;
