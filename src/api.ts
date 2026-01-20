import type { Passenger, Booking } from "./store";

export const MOCK_TOKEN = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJodHRwczovL2lkcC5hY21lLWRlbW8uZXhhbXBsZSIsImF1ZCI6ImFjbWUtYWlybGluZXMtYXBpIiwic3ViIjoiNmU2ZTZjZjEtOWU1MC00YTRlLTlkOGItM2FhOGI0YzRlM2ExIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBwYXNzZW5nZXI6cmVhZCIsImlhdCI6MTczNzM1ODQwMCwiZXhwIjoxNzM3MzYyMDAwfQ.";

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";
const FALLBACK_TO_MOCK = true;

type PassengerMeResponse = { passenger: Passenger };
type BookingRetrieveResponse = { passenger: Passenger; booking: Booking };

export type CreateSessionRequest = {
  passengerId: string;
  bookingPnr: string;
  device?: { clientType?: string; userAgent?: string };
};

export type CreateSessionResponse = {
  sessionId: string;
  wsUrl: string;
  expiresAt: string;
  heartbeatIntervalSec: number;
};

const mockPassenger: Passenger = {
  id: "6e6e6cf1-9e50-4a4e-9d8b-3aa8b4c4e3a1",
  firstName: "Joe",
  lastName: "Nightingale",
  loyaltyPoints: 48399,
};

// mock gate is mutable so notifications can “change gate” and the follow-up retrieve returns new values
let mockGate = "12";
export function setMockGate(newGate: string) {
  mockGate = newGate;
}

function getMockBooking(): Booking {
  return {
    pnr: "AB12CD",
    status: "CONFIRMED",
    flight: {
      id: "2f3d2e21-9b6f-4a8a-88d2-24d8704fe2b0",
      flightNumber: "VA801",
      origin: { code: "MEL", city: "Melbourne", country: "Australia" },
      destination: { code: "SYD", city: "Sydney", country: "Australia" },
      departureTime: "2026-01-21T09:15:00+11:00",
      arrivalTime: "2026-01-21T10:40:00+11:00",
      boardingGate: mockGate,
    },
  };
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MOCK_TOKEN}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`.trim());
  }

  // 204 handling
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export async function getPassengerMe(): Promise<Passenger> {
  try {
    const data = await apiRequest<PassengerMeResponse>("/api/v1/passenger/me", { method: "GET" });
    return data.passenger;
  } catch (e) {
    if (!FALLBACK_TO_MOCK) throw e;
    return mockPassenger;
  }
}

export async function retrieveBooking(pnr: string, lastName: string): Promise<BookingRetrieveResponse> {
  const qp = new URLSearchParams({ pnr, lastName });
  try {
    return await apiRequest<BookingRetrieveResponse>(`/api/v1/bookings/retrieve?${qp.toString()}`, {
      method: "GET",
    });
  } catch (e) {
    if (!FALLBACK_TO_MOCK) throw e;

    const ok =
      pnr.trim().toUpperCase() === "AB12CD" &&
      lastName.trim().toLowerCase() === mockPassenger.lastName.toLowerCase();

    if (!ok) {
      throw new Error("Booking not found. Try AB12CD + Nightingale.");
    }

    return { passenger: mockPassenger, booking: getMockBooking() };
  }
}

export async function createNotificationSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
  try {
    return await apiRequest<CreateSessionResponse>("/api/v1/notifications/sessions", {
      method: "POST",
      body: JSON.stringify(req),
    });
  } catch (e) {
    if (!FALLBACK_TO_MOCK) throw e;

    // Mock: return a wsUrl that will fail to connect, but the app will simulate an incoming notification on error.
    return {
      sessionId: "00000000-0000-0000-0000-000000000001",
      wsUrl: "ws://localhost:0/ws/v1/notifications?sessionId=00000000-0000-0000-0000-000000000001",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      heartbeatIntervalSec: 25,
    };
  }
}

export async function closeNotificationSession(sessionId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/notifications/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}
