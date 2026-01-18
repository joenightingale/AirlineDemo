import React, { useEffect } from "react";
import { getPassengerMe } from "./api";
import { useAppStore } from "./store";
import { Icons } from "./ui/Icons";

function formatPoints(n: number) {
  return n.toLocaleString("en-AU");
}

function formatTime(dtIso: string) {
  const d = new Date(dtIso);
  return d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dtIso: string) {
  const d = new Date(dtIso);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

export default function Home() {
  const passenger = useAppStore((s) => s.passenger);
  const booking = useAppStore((s) => s.booking);
  const setPassenger = useAppStore((s) => s.setPassenger);
  const openRetrieve = useAppStore((s) => s.openRetrieveModal);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getPassengerMe();
      if (!cancelled) setPassenger(p);
    })();
    return () => {
      cancelled = true;
    };
  }, [setPassenger]);

  const name = passenger?.firstName ?? "Joseph";
  const points = passenger?.loyaltyPoints ?? 48399;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-red to-brand-purple text-white px-5 pt-10 pb-6 relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg opacity-90">Good morning,</div>
            <div className="text-5xl font-semibold tracking-tight mt-1">{name}</div>

            <div className="mt-5">
              <div className="text-3xl font-semibold">{formatPoints(points)}</div>
              <div className="text-lg opacity-90 flex items-center gap-2">
                Velocity Points <span className="text-xl">›</span>
              </div>
            </div>
          </div>

          <button className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center">
            <span className="text-xl">👤</span>
          </button>
        </div>

        {/* QR icon block (right) */}
        <div className="absolute right-5 bottom-[-18px]">
          <div className="h-14 w-14 rounded-2xl bg-brand-red shadow-card flex items-center justify-center">
            <Icons.QrCode className="text-white" size={26} />
          </div>
        </div>
      </div>

      {/* Ad banner */}
      <div className="px-5 mt-8">
        <div className="rounded-2xl overflow-hidden shadow-card bg-gray-100 relative min-h-[132px]">
  <div className="h-[132px] bg-gradient-to-r from-black/40 to-black/10" />
  <div className="absolute inset-0 px-4 py-5 text-white">
            <div className="text-sm opacity-90 flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20">🕒</span>
              <span className="font-semibold">Book now</span>
              <span className="ml-auto opacity-90">2d</span>
            </div>
            <div className="mt-2 text-3xl font-semibold leading-none">The sale</div>
            <div className="mt-1 text-sm opacity-90">
              Sale ends 19 Jan 2026. <span className="underline">T&amp;Cs apply*</span>
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl opacity-90">›</div>
        </div>
      </div>

      {/* Flights */}
      <div className="px-5 mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-semibold text-brand-ink">Flights</h2>
          <button onClick={openRetrieve} className="text-brand-red font-semibold text-lg">
            Retrieve booking <span className="text-2xl align-[-2px]">+</span>
          </button>
        </div>

        {/* Flight card area */}
        <div className="mt-4">
          {!booking ? (
            <div className="rounded-2xl shadow-card bg-white border border-gray-100 px-5 py-5">
              <div className="flex items-center justify-between">
                <div className="w-[40%]">
                  <div className="text-4xl font-semibold text-brand-ink">MEL</div>
                  <div className="text-sm text-brand-ink/60">Melbourne, Australia</div>
                </div>

                <div className="w-[20%] flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-brand-soft flex items-center justify-center">
                    <Icons.ArrowRight className="text-brand-ink/70" size={22} />
                  </div>
                </div>

                <div className="w-[40%] flex items-center justify-center">
                  <div className="text-lg text-brand-ink/50 font-semibold">Fly to</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl shadow-card bg-white border border-gray-100 px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-brand-ink/60 font-semibold">Upcoming flight</div>
                  <div className="mt-1 text-3xl font-semibold text-brand-ink">
                    {booking.flight.origin.code} <span className="text-brand-ink/40">→</span> {booking.flight.destination.code}
                  </div>
                  <div className="mt-1 text-brand-ink/70">
                    {formatDate(booking.flight.departureTime)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-brand-ink/60">{booking.flight.flightNumber}</div>
                  <div className="text-2xl font-semibold text-brand-ink">{formatTime(booking.flight.departureTime)}</div>
                  <div className="text-sm text-brand-ink/60">
                    Gate {booking.flight.boardingGate ?? "TBA"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3">
                <div className="text-sm text-brand-ink/70">
                  PNR <span className="font-semibold text-brand-ink">{booking.pnr}</span>
                </div>
                <div className="text-sm text-brand-ink/70">
                  Status <span className="font-semibold text-brand-ink">{booking.status}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Travel extras */}
      <div className="px-5 mt-8">
        <h3 className="text-3xl font-semibold text-brand-ink">Travel extras</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <button className="rounded-2xl shadow-card bg-white border border-gray-100 px-5 py-5 text-left">
            <div className="text-2xl font-semibold text-brand-ink">Hotels</div>
            <div className="mt-3 text-3xl">🏨</div>
          </button>
          <button className="rounded-2xl shadow-card bg-white border border-gray-100 px-5 py-5 text-left">
            <div className="text-2xl font-semibold text-brand-ink">Car hire</div>
            <div className="mt-3 text-3xl">🚗</div>
          </button>
        </div>
      </div>

      {/* Recommended (light mock) */}
      <div className="px-5 mt-8">
        <h3 className="text-3xl font-semibold text-brand-ink">Recommended</h3>

        <div className="mt-4 flex items-center gap-6">
          <div className="text-brand-ink font-semibold">✨ Trending</div>
          <div className="text-brand-ink/50 font-semibold">⭐ Specials</div>
        </div>
        <div className="mt-2 h-1 w-20 bg-brand-red rounded-full" />
        <div className="mt-4 rounded-2xl shadow-card bg-white border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="text-2xl font-semibold text-brand-ink">The sale</div>
            <div className="mt-2 text-brand-ink/70">
              Save up to 25% off selected flights to 35 destinations. Hurry, sale ends midnight AEST 19 January 2026.*
            </div>
            <button className="mt-4 rounded-xl border border-brand-red text-brand-red px-4 py-3 font-semibold">
              Find sale fares
            </button>
          </div>
          <div className="h-28 bg-gradient-to-r from-gray-100 to-gray-50" />
        </div>
      </div>
    </div>
  );
}
