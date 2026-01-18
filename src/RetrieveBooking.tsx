import React, { useMemo, useState } from "react";
import { retrieveBooking } from "./api";
import { useAppStore } from "./store";

export default function RetrieveBooking() {
  const open = useAppStore((s) => s.retrieveModalOpen);
  const close = useAppStore((s) => s.closeRetrieveModal);
  const setPassenger = useAppStore((s) => s.setPassenger);
  const setBooking = useAppStore((s) => s.setBooking);

  const [pnr, setPnr] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => pnr.trim().length === 6 && lastName.trim().length >= 2, [pnr, lastName]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await retrieveBooking(pnr.trim().toUpperCase(), lastName.trim());
      setPassenger(res.passenger);
      setBooking(res.booking);
      close();
    } catch (error: any) {
      setErr(error?.message ?? "Unable to retrieve booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="absolute inset-0 flex justify-center">
        <div className="w-full max-w-md bg-brand-purple text-white pt-14 px-6">
          <button
            onClick={close}
            className="absolute right-5 top-5 h-10 w-10 rounded-full border border-white/40 flex items-center justify-center text-white/90"
            aria-label="Close"
          >
            ✕
          </button>

          <h1 className="text-4xl font-semibold tracking-tight">Retrieve your booking</h1>

          <form onSubmit={onSubmit} className="mt-10 space-y-6">
            <div>
              <label className="sr-only">Booking reference</label>
              <input
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="Booking reference"
                className="w-full rounded-xl border border-white/30 bg-transparent px-4 py-4 text-white placeholder-white/40 outline-none focus:border-white/60"
              />
              <p className="mt-2 text-xs text-white/40">6 characters (letters/numbers)</p>
            </div>

            <div>
              <label className="sr-only">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-white/30 bg-transparent px-4 py-4 text-white placeholder-white/40 outline-none focus:border-white/60"
              />
            </div>

            {err && (
              <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={[
                "w-full rounded-xl border border-white/60 px-4 py-4 text-lg font-semibold",
                "hover:bg-white/10 active:bg-white/15 transition",
                (!canSubmit || loading) ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {loading ? "Retrieving..." : "Retrieve booking"}
            </button>

            <div className="pb-10" />
          </form>
        </div>
      </div>
    </div>
  );
}
