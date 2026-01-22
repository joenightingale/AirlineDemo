# Virgin Australia Airlines Demo SPA (Mock Mobile App)

This project is a browser-based Single Page Application (SPA) to simulate Virgin Australia's mobile app.

It demonstrates a gateway-centric “Service Management Layer” pattern:
- REST APIs for passenger + booking retrieval (managed via IBM API Connect)
- WebSocket notifications (direct endpoint today; can be routed via the gateway)
- Backend orchestration/state (implemented with webMethods IWHI)
- Async/event-driven updates (Kafka events) that drive passenger notifications

---

## Tech Stack

Frontend:
- React + Vite + TypeScript
- Tailwind CSS (brand gradient, rounded cards, bottom nav, modal)
- Zustand state management
- Lucide-React icons

Backend:
- OpenAPI specs included for REST + WebSocket message schema
- AsyncAPI spec included for Kafka flight change events

Database:
- PostgreSQL schema + seed data (`schema.sql`)

---

## User Flow (Demo Script)

1. User opens the app.
   - Home loads passenger details via: `GET /api/v1/passenger/me`

2. User clicks **Trips > Retrieve booking**
   - Enters PNR + last name

3. Booking is retrieved via:
   - `GET /api/v1/bookings/retrieve?pnr=AB12CD&lastName=Nightingale`

4. Home updates to display the upcoming flight details.

5. The app registers for real-time notifications:
   - Establishes a WebSocket connection directly to `ws://4.198.139.1:5533/ws/mobileapp`

6. In the real world:
   - Flight Ops updates a flight via a Flight Ops API on the gateway
   - webMethods updates Postgres and produces a Kafka event per affected passenger
   - A notification backend consumes the Kafka event, calls OpenAI to tailor a message,
     and pushes that message to connected passenger sessions via WebSocket.

7. When the app receives a flight change notification:
   - It shows an in-app toast notification
   - It automatically calls retrieve booking again to refresh the flight details.

---

## API Dependencies

The SPA calls these HTTP endpoints (see specs for details).

### Passenger profile
**GET** `/api/v1/passenger/me`

Used for:
- “Good morning, Joe”
- Loyalty points

### Booking retrieval
**GET** `/api/v1/bookings/retrieve?pnr=...&lastName=...`

Used for:
- Retrieved booking + flight details shown on Home

### Notification WebSocket (Direct endpoint)
**GET** `ws://4.198.139.1:5533/ws/mobileapp`
This is a WebSocket upgrade endpoint. The SPA connects directly to this URL.

---

## Authentication

There is no login screen. The user is assumed authenticated.

All API calls include:
- `Authorization: Bearer oidc_mock_token_123`

The token is defined in:
- `src/api.ts`

---

## How the WebSocket Works (Client View)

After a booking is successfully retrieved (meaning the user has a trip context), the SPA:
1. Connects directly using WebSocket:
   - `new WebSocket("ws://4.198.139.1:5533/ws/mobileapp")`
2. Sends an optional “hello” message:
   - `{ "type": "hello", "passengerId": "...", "bookingPnr": "..." }`
3. Listens for outbound messages shaped like:

```json
{
  "type": "notification",
  "eventType": "flight.changed",
  "correlationId": "uuid-or-string",
  "occurredAt": "2026-01-21T06:12:11Z",
  "payload": {
    "passengerId": "uuid",
    "bookingPnr": "AB12CD",
    "flightId": "uuid",
    "flightNumber": "VA801",
    "change": {
      "field": "boardingGate",
      "oldValue": "12",
      "newValue": "14"
    },
    "message": "Hi Joe, your gate for VA801 has changed from 12 to 14..."
  }
}
```

When received:
- The SPA displays a toast notification with `payload.message`
- Then it automatically calls `/api/v1/bookings/retrieve` again to refresh the card on Home.

---

## Specs Included

- `api-spec.yaml`
  - Passenger + booking retrieval OpenAPI (original)
- `openapi-flight-ops.yaml`
  - Flight Ops update endpoint (PATCH)
- `api-spec-websocket-notifications.yaml`
  - Notification WebSocket message schema
- `asyncapi-flight-changed.yaml`
  - Kafka topic `virgin.flight.changed.v1` event definition

---

## Mock Mode (Critical for Demos)

To make sure the demo never stalls if no backend is running, the SPA includes **mock fallback**.

If REST calls fail:
- Passenger is mocked as Joe Nightingale (48,399 points)
- Booking retrieval succeeds only for:
  - PNR: `AB12CD`
  - Last name: `Nightingale`

Mock fallback is implemented in:
- `src/api.ts` (`FALLBACK_TO_MOCK = true`)

### WebSocket fallback behavior
If the WebSocket connection fails (for example, because no gateway is running),
the SPA automatically simulates a **gate change notification** after a short delay.
This lets you demo the UX even with no server.

---

## Simulating a Notification (Two Options)

### Option A (Built-in simulation, easiest)
1. Start the app: `npm run dev`
2. Retrieve a booking using:
   - PNR: `AB12CD`
   - Last name: `Nightingale`
3. If no WebSocket server is running, the SPA will:
   - attempt to connect
   - fail
   - automatically simulate a `flight.changed` notification ~6–7 seconds later
4. You’ll see:
   - A toast notification (AI-tailored message)
   - The Home flight card updates (gate changes)

This is implemented in:
- `src/App.tsx` (WS error handler triggers a simulated message + refresh)

### Option B (Manual simulation from the browser console)
If you want to trigger a notification on demand (even if WS is working),
you can add a small helper in `src/App.tsx` (recommended below), or call a helper if included.

Recommended: add a simple global helper for demos:
- In `src/App.tsx`, inside the main component, add this once:

```ts
// DEV/DEMO helper: window.__simulateGateChange("14")
(window as any).__simulateGateChange = async (newGate: string) => {
  // this function is already supported by the mock plumbing:
  // it updates mock gate state + emits toast + refreshes booking
};
```

If you want me to provide the exact code block for that helper (plug-and-play),
tell me if you prefer:
- Toggle gate (12 <-> 14), or
- Set a specific gate number.

(For most demos, a toggle is easiest.)

---

## Setup & Installation

### Prerequisites
- Node.js 18+ recommended
- npm

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

App runs at:
- `http://localhost:5173`

---

## Connecting to a Real Backend (Optional)

By default, API calls use relative paths (e.g. `/api/v1/passenger/me`).

If your gateway/backend is on a different host/port, set `VITE_API_BASE_URL`.

Mac/Linux:
```bash
export VITE_API_BASE_URL="http://localhost:8080"
export VITE_MOBILEAPP_WS_URL="ws://4.198.139.1:5533/ws/mobileapp"
npm run dev
```

Windows PowerShell:
```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
$env:VITE_MOBILEAPP_WS_URL="ws://4.198.139.1:5533/ws/mobileapp"
npm run dev
```

Notes:
- The SPA always sends `Authorization: Bearer oidc_mock_token_123`
- Your APIC policies can validate or ignore it depending on your demo.
- The WebSocket endpoint can be overridden via `VITE_MOBILEAPP_WS_URL`.

---

## Database Scripts

### `schema.sql`
Defines and seeds:
- `passengers`
- `airports`
- `flights`
- `bookings`

Includes seeded data:
- Passenger: Joe Nightingale (48,399 points)
- Flight: VA801 MEL → SYD (21 Jan 2026)
- Booking: PNR `AB12CD`

Run:
```bash
psql -d yourdb -f schema.sql
```

---

## File Map (What Each File Does)

Root:
- `schema.sql` PostgreSQL schema + demo seed data
- `api-spec.yaml` OpenAPI for passenger + booking retrieval
- `openapi-flight-ops.yaml` OpenAPI for Flight Ops update endpoint
- `api-spec-websocket-notifications.yaml` OpenAPI + WebSocket message schema
- `asyncapi-flight-changed.yaml` AsyncAPI for Kafka flight change events
- `tailwind.config.js` Tailwind theme + brand colors/shadows
- `postcss.config.js` Tailwind PostCSS wiring
- `vite.config.ts` Vite config
- `package.json` dependencies + scripts
- `tsconfig.json` TS config
- `index.html` app entrypoint

`src/`:
- `main.tsx` React entry
- `index.css` Tailwind directives
- `App.tsx` app shell, WS connection logic, toast stack, routing
- `Home.tsx` Home UI; displays passenger + booking card; optional WS status
- `Trips.tsx` Trips UI with empty state + retrieve CTA
- `RetrieveBooking.tsx` modal overlay for booking retrieval
- `store.ts` Zustand store (passenger/booking, ws status, notifications)
- `api.ts` fetch wrapper + token injection + mock fallback for passenger/booking

`src/ui/`:
- `BottomNav.tsx` mobile-style bottom navigation
- `Icons.tsx` lucide icon exports

---

## Next Steps (Optional Enhancements)
- Add an in-app “Notifications” screen/history
- Add a “Flight Ops” admin panel screen to invoke the update API (PATCH) from the demo UI
- Add correlation ID display in UI for tracing demos
- Add a visible “Connected to notifications” badge with heartbeat status
