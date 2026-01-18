import React, { useEffect, useRef } from "react";
import { useAppStore } from "./store";
import Home from "./Home";
import Trips from "./Trips";
import RetrieveBooking from "./RetrieveBooking";
import { BottomNav } from "./ui/BottomNav";
import {
  createNotificationSession,
  closeNotificationSession,
  retrieveBooking,
  setMockGate,
} from "./api";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-5 pt-10">
        <h1 className="text-5xl font-semibold text-brand-ink">{title}</h1>
        <div className="mt-6 text-brand-ink/70">
          Placeholder screen for the demo. Navigation is wired, but content is intentionally minimal.
        </div>
      </div>
    </div>
  );
}

function ToastStack() {
  const notifications = useAppStore((s) => s.notifications);
  const dismiss = useAppStore((s) => s.dismissNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-3 left-0 right-0 z-50">
      <div className="mx-auto max-w-md px-4 space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="rounded-2xl shadow-card bg-white border border-gray-100 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-brand-ink">{n.title}</div>
                <div className="mt-1 text-sm text-brand-ink/70">{n.message}</div>
                <div className="mt-2 text-xs text-brand-ink/45">
                  {new Date(n.occurredAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="h-8 w-8 rounded-full bg-brand-soft text-brand-ink/70 flex items-center justify-center"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const tab = useAppStore((s) => s.activeTab);
  const passenger = useAppStore((s) => s.passenger);
  const booking = useAppStore((s) => s.booking);

  const setPassenger = useAppStore((s) => s.setPassenger);
  const setBooking = useAppStore((s) => s.setBooking);

  const wsStatus = useAppStore((s) => s.wsStatus);
  const setWsStatus = useAppStore((s) => s.setWsStatus);
  const setWsSession = useAppStore((s) => s.setWsSession);

  const addNotification = useAppStore((s) => s.addNotification);

  const wsRef = useRef<WebSocket | null>(null);
  const mockTimerRef = useRef<number | null>(null);

  // Connect WebSocket when we have a booking (i.e., after retrieve booking succeeds)
  useEffect(() => {
    let cancelled = false;

    async function connect() {
      if (!booking || !passenger) return;
      if (wsRef.current) return; // already connected/connecting

      setWsStatus("connecting");

      try {
        const session = await createNotificationSession({
          passengerId: passenger.id,
          bookingPnr: booking.pnr,
          device: { clientType: "spa", userAgent: navigator.userAgent },
        });

        if (cancelled) return;

        setWsSession(session.sessionId, session.wsUrl);

        const ws = new WebSocket(session.wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus("connected");
          // optional hello, safe even if server ignores
          ws.send(JSON.stringify({ type: "hello", sessionId: session.sessionId }));
        };

        ws.onerror = () => {
          setWsStatus("error");
          // If WS fails (demo fallback), simulate a gate change notification
          if (mockTimerRef.current == null) {
            mockTimerRef.current = window.setTimeout(async () => {
              // simulate gate change 12 -> 14
              const oldGate = booking.flight.boardingGate ?? "12";
              const newGate = oldGate === "14" ? "12" : "14";

              // update mock backend state so retrieveBooking returns new gate
              setMockGate(newGate);

              const occurredAt = new Date().toISOString();
              const correlationId = crypto.randomUUID();

              addNotification({
                id: crypto.randomUUID(),
                eventType: "flight.changed",
                title: `Gate change for ${booking.flight.flightNumber}`,
                message: `Hi ${passenger.firstName}, your gate for ${booking.flight.flightNumber} has changed from ${oldGate} to ${newGate}. Head to Gate ${newGate} when you're ready.`,
                occurredAt,
                correlationId,
                payload: {
                  passengerId: passenger.id,
                  bookingPnr: booking.pnr,
                  flightId: booking.flight.id,
                  flightNumber: booking.flight.flightNumber,
                  change: { field: "boardingGate", oldValue: oldGate, newValue: newGate },
                },
              });

              // Step 13: refresh booking via retrieve endpoint
              try {
                const refreshed = await retrieveBooking(booking.pnr, passenger.lastName);
                setPassenger(refreshed.passenger);
                setBooking(refreshed.booking);
              } catch {
                // ignore
              }
            }, 6500);
          }
        };

        ws.onmessage = async (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data?.type === "notification" && data?.eventType === "flight.changed") {
              const occurredAt = data.occurredAt ?? new Date().toISOString();
              const correlationId = data.correlationId ?? crypto.randomUUID();
              const payload = data.payload;

              const oldGate = payload?.change?.oldValue ?? "";
              const newGate = payload?.change?.newValue ?? "";
              const flightNumber = payload?.flightNumber ?? booking.flight.flightNumber;

              // Keep mock gate in sync if running without backend
              if (newGate) setMockGate(String(newGate));

              addNotification({
                id: crypto.randomUUID(),
                eventType: "flight.changed",
                title: `Gate change for ${flightNumber}`,
                message: payload?.message ?? data.message ?? `Gate changed from ${oldGate} to ${newGate}.`,
                occurredAt,
                correlationId,
                payload: {
                  passengerId: payload.passengerId,
                  bookingPnr: payload.bookingPnr,
                  flightId: payload.flightId,
                  flightNumber,
                  change: payload.change,
                },
              });

              // Step 13: re-get flight details after notification
              const refreshed = await retrieveBooking(booking.pnr, passenger.lastName);
              setPassenger(refreshed.passenger);
              setBooking(refreshed.booking);
            }
          } catch {
            // ignore non-json messages
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          setWsStatus("disconnected");
        };
      } catch {
        setWsStatus("error");
      }
    }

    // connect only after booking exists
    connect();

    return () => {
      cancelled = true;
    };
  }, [
    booking,
    passenger,
    addNotification,
    setPassenger,
    setBooking,
    setWsStatus,
    setWsSession,
  ]);

  // Cleanup WS when booking cleared (optional), or when app unmounts
  useEffect(() => {
    return () => {
      if (mockTimerRef.current != null) {
        window.clearTimeout(mockTimerRef.current);
        mockTimerRef.current = null;
      }
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) ws.close();

      // best-effort session close if you want (requires sessionId stored)
      // (kept minimal here to avoid blocking on errors)
    };
  }, []);

  return (
    <div className="mx-auto max-w-md relative">
      <ToastStack />

      {tab === "home" && <Home />}
      {tab === "trips" && <Trips />}
      {tab === "book" && <Placeholder title="Book" />}
      {tab === "specials" && <Placeholder title="Specials" />}
      {tab === "more" && (
        <div className="min-h-screen bg-white pb-20">
          <div className="px-5 pt-10">
            <h1 className="text-5xl font-semibold text-brand-ink">More</h1>
            <div className="mt-6 text-brand-ink/70">
              WebSocket status: <span className="font-semibold text-brand-ink">{wsStatus}</span>
            </div>
          </div>
        </div>
      )}

      <RetrieveBooking />
      <BottomNav />
    </div>
  );
}
