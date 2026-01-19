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
  ('ADL', 'Adelaide', 'Australia'),
  ('PER', 'Perth', 'Australia'),
  ('CBR', 'Canberra', 'Australia'),
  ('HBA', 'Hobart', 'Australia'),
  ('CNS', 'Cairns', 'Australia'),
  ('OOL', 'Gold Coast', 'Australia')
ON CONFLICT DO NOTHING;

-- Seed passenger (Joe persona)
INSERT INTO passengers (id, first_name, last_name, loyalty_points)
VALUES
  ('6e6e6cf1-9e50-4a4e-9d8b-3aa8b4c4e3a1', 'Joe', 'Nightingale', 48399)
ON CONFLICT (id) DO NOTHING;

-- Seed flight
INSERT INTO flights (
  id, flight_number, origin_code, destination_code, departure_time, arrival_time, boarding_gate
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'VA802', 'SYD', 'MEL',
   '2026-01-22T18:20:00+11:00', '2026-01-22T19:55:00+11:00', '8'),

  ('22222222-2222-2222-2222-222222222222', 'VA335', 'MEL', 'BNE',
   '2026-01-23T07:05:00+11:00', '2026-01-23T08:20:00+10:00', '22'),

  ('33333333-3333-3333-3333-333333333333', 'VA912', 'SYD', 'BNE',
   '2026-01-24T16:10:00+11:00', '2026-01-24T17:35:00+10:00', '15'),

  ('44444444-4444-4444-4444-444444444444', 'VA681', 'MEL', 'PER',
   '2026-01-25T09:25:00+11:00', '2026-01-25T11:40:00+08:00', '3'),

  ('55555555-5555-5555-5555-555555555555', 'VA128', 'PER', 'SYD',
   '2026-01-26T13:15:00+08:00', '2026-01-26T19:55:00+11:00', '6'),

  ('66666666-6666-6666-6666-666666666666', 'VA152', 'SYD', 'ADL',
   '2026-01-27T10:30:00+11:00', '2026-01-27T11:55:00+10:30', '19'),

  ('77777777-7777-7777-7777-777777777777', 'VA401', 'BNE', 'CNS',
   '2026-01-28T08:10:00+10:00', '2026-01-28T10:20:00+10:00', '12'),

  ('88888888-8888-8888-8888-888888888888', 'VA775', 'SYD', 'HBA',
   '2026-01-29T14:40:00+11:00', '2026-01-29T16:35:00+11:00', '7'),

  ('99999999-9999-9999-9999-999999999999', 'VA214', 'MEL', 'CBR',
   '2026-01-30T06:50:00+11:00', '2026-01-30T07:55:00+11:00', '5'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'VA630', 'MEL', 'OOL',
   '2026-01-31T12:05:00+11:00', '2026-01-31T13:25:00+10:00', '10')
ON CONFLICT DO NOTHING;

-- Seed booking (valid retrieval)
INSERT INTO bookings (pnr_reference, passenger_id, flight_id, status)
VALUES
  ('AB12CD', '6e6e6cf1-9e50-4a4e-9d8b-3aa8b4c4e3a1', '2f3d2e21-9b6f-4a8a-88d2-24d8704fe2b0', 'CONFIRMED')
ON CONFLICT (pnr_reference) DO NOTHING;
