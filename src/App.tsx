import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "./store";
import Home from "./Home";
import Trips from "./Trips";
import RetrieveBooking from "./RetrieveBooking";
import { BottomNav } from "./ui/BottomNav";
import { retrieveBooking, setMockGate } from "./api";

const MOBILEAPP_WS_URL =
  (import.meta as any).env?.VITE_MOBILEAPP_WS_URL ?? "ws://4.198.139.1:5533/ws/mobileapp";

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

  const addNotification = useAppStore((s) => s.addNotification);

  const wsRef = useRef<WebSocket | null>(null);
  const mockTimerRef = useRef<number | null>(null);
  const [wsUrl, setWsUrl] = useState(MOBILEAPP_WS_URL);
  const [wsMessage, setWsMessage] = useState('{"type":"ping"}');
  const [wsLogs, setWsLogs] = useState<
    { id: string; timestamp: string; label: string; detail?: string }[]
  >([]);

  const pushLog = useCallback((label: string, detail?: string) => {
    setWsLogs((logs) => [
      { id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), label, detail },
      ...logs,
    ]);
  }, []);

  const cleanupMockTimer = useCallback(() => {
    if (mockTimerRef.current != null) {
      window.clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      pushLog("Already connected or connecting.");
      return;
    }

    cleanupMockTimer();
    setWsStatus("connecting");
    pushLog("Connecting", wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus("connected");
        pushLog("Connected");

        if (passenger && booking) {
          ws.send(
            JSON.stringify({
              type: "hello",
              passengerId: passenger.id,
              bookingPnr: booking.pnr,
              device: { clientType: "spa", userAgent: navigator.userAgent },
            }),
          );
          pushLog("Sent hello payload", "Included passenger + booking metadata.");
        }
      };

      ws.onerror = () => {
        setWsStatus("error");
        pushLog("WebSocket error");
      };

      ws.onmessage = async (evt) => {
        pushLog("Message received", typeof evt.data === "string" ? evt.data : "Binary payload");
        try {
          const data = JSON.parse(evt.data);
          if (data?.type === "notification" && data?.eventType === "flight.changed" && booking) {
            const occurredAt = data.occurredAt ?? new Date().toISOString();
            const correlationId = data.correlationId ?? crypto.randomUUID();
            const payload = data.payload;

            const oldGate = payload?.change?.oldValue ?? "";
            const newGate = payload?.change?.newValue ?? "";
            const flightNumber = payload?.flightNumber ?? booking.flight.flightNumber;

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

            const refreshed = await retrieveBooking(booking.pnr, passenger.lastName);
            setPassenger(refreshed.passenger);
            setBooking(refreshed.booking);
          }
        } catch {
          // ignore non-json messages
        }
      };

      ws.onclose = (evt) => {
        wsRef.current = null;
        setWsStatus("disconnected");
        pushLog("Disconnected", `Code ${evt.code}${evt.reason ? `: ${evt.reason}` : ""}`);
      };
    } catch {
      setWsStatus("error");
      pushLog("Connection failed");
    }
  }, [
    addNotification,
    booking,
    passenger,
    pushLog,
    setBooking,
    setPassenger,
    setWsStatus,
    wsUrl,
    cleanupMockTimer,
  ]);

  const disconnectWebSocket = useCallback(() => {
    cleanupMockTimer();
    if (!wsRef.current) {
      pushLog("No active WebSocket to disconnect.");
      setWsStatus("disconnected");
      return;
    }
    pushLog("Closing connection");
    wsRef.current.close();
  }, [cleanupMockTimer, pushLog, setWsStatus]);

  const scheduleMockNotification = useCallback(() => {
    if (!booking || !passenger) {
      pushLog("Cannot schedule notification", "Retrieve your booking first.");
      return;
    }
    if (mockTimerRef.current != null) {
      pushLog("Mock notification already scheduled.");
      return;
    }

    pushLog("Mock notification scheduled", "Delivery in 5s.");
    mockTimerRef.current = window.setTimeout(async () => {
      mockTimerRef.current = null;
      const oldGate = booking.flight.boardingGate ?? "12";
      const newGate = oldGate === "14" ? "12" : "14";

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

      try {
        const refreshed = await retrieveBooking(booking.pnr, passenger.lastName);
        setPassenger(refreshed.passenger);
        setBooking(refreshed.booking);
      } catch {
        // ignore
      }
    }, 5000);
  }, [addNotification, booking, passenger, pushLog, setBooking, setPassenger]);

  const sendWsMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      pushLog("Cannot send message", "Socket not open.");
      return;
    }
    wsRef.current.send(wsMessage);
    pushLog("Message sent", wsMessage);
  };

  // Cleanup WS when booking cleared (optional), or when app unmounts
  useEffect(() => {
    return () => {
      cleanupMockTimer();
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) ws.close();

      // WS closes on teardown; no session cleanup required.
    };
  }, [cleanupMockTimer]);

  useEffect(() => {
    if (passenger) {
      connectWebSocket();
    }
  }, [connectWebSocket, passenger]);

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
            <h1 className="text-5xl font-semibold text-brand-ink">WebSockets Lab</h1>
            <div className="mt-3 text-brand-ink/70">
              Test connectivity, manage the socket lifecycle, and inspect live traffic.
            </div>

            <div className="mt-8 space-y-6">
              <div className="rounded-3xl border border-gray-100 bg-brand-soft/30 p-5 shadow-card">
                <div className="text-sm font-semibold text-brand-ink">Connection</div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-brand-ink/70">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        wsStatus === "connected"
                          ? "bg-green-500"
                          : wsStatus === "connecting"
                            ? "bg-amber-400"
                            : wsStatus === "error"
                              ? "bg-red-500"
                              : "bg-gray-300"
                      }`}
                    />
                    {wsStatus}
                  </span>
                  {wsRef.current?.url && (
                    <span className="text-xs text-brand-ink/50">Active URL: {wsRef.current.url}</span>
                  )}
                </div>

                <label className="mt-4 block text-xs font-semibold text-brand-ink/60 uppercase tracking-wide">
                  WebSocket URL
                </label>
                <input
                  value={wsUrl}
                  onChange={(event) => setWsUrl(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-ink shadow-sm focus:border-brand-sky focus:outline-none"
                  placeholder="ws://host:port/path"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={connectWebSocket}
                    className="rounded-full bg-brand-ink px-5 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    Connect
                  </button>
                  <button
                    onClick={disconnectWebSocket}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-brand-ink shadow-sm"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => setWsLogs([])}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-brand-ink/70"
                  >
                    Clear log
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                <div className="text-sm font-semibold text-brand-ink">Notifications demo</div>
                <div className="mt-2 text-sm text-brand-ink/70">
                  Trigger a simulated gate-change notification from the demo backend.
                </div>
                <button
                  onClick={scheduleMockNotification}
                  className="mt-4 rounded-full bg-brand-red px-5 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  Deliver notification in 5s
                </button>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                <div className="text-sm font-semibold text-brand-ink">Send a test message</div>
                <textarea
                  value={wsMessage}
                  onChange={(event) => setWsMessage(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-ink shadow-sm focus:border-brand-sky focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand-ink/60">
                  <button
                    onClick={sendWsMessage}
                    className="rounded-full bg-brand-sky px-5 py-2 text-sm font-semibold text-white shadow-sm"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setWsMessage('{"type":"ping"}')}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-brand-ink/70"
                  >
                    Insert ping
                  </button>
                  <button
                    onClick={() =>
                      setWsMessage(
                        JSON.stringify(
                          {
                            type: "notification",
                            eventType: "flight.changed",
                            message: "Gate changed from 12 to 14.",
                          },
                          null,
                          2,
                        ),
                      )
                    }
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-brand-ink/70"
                  >
                    Insert sample notification
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-brand-ink">Debug log</div>
                  <div className="text-xs text-brand-ink/50">{wsLogs.length} entries</div>
                </div>
                <div className="mt-4 space-y-3">
                  {wsLogs.length === 0 && (
                    <div className="text-sm text-brand-ink/50">No WebSocket activity yet.</div>
                  )}
                  {wsLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-gray-100 bg-brand-soft/40 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-brand-ink/60">
                        <span>{log.timestamp}</span>
                        <span className="font-semibold text-brand-ink">{log.label}</span>
                      </div>
                      {log.detail && <div className="mt-2 text-xs text-brand-ink/70">{log.detail}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <RetrieveBooking />
      <BottomNav />
    </div>
  );
}
