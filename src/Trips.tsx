import React from "react";
import { useAppStore } from "./store";

function Illustration() {
  // Simple inline SVG placeholder echoing the plane/umbrella vibe
  return (
    <img src="./src/img/umbrella.png" alt="A beach umbrella and ball" className="w-72 h-auto" />
  );
}

export default function Trips() {
  const openRetrieve = useAppStore((s) => s.openRetrieveModal);

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="px-5 pt-10">
        <div className="flex items-center justify-between">
          <h1 className="text-5xl font-semibold text-brand-ink">Trips</h1>
          <button onClick={openRetrieve} className="text-brand-red font-semibold text-lg">
            Retrieve booking <span className="text-2xl align-[-2px]">+</span>
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center text-center">
          <Illustration />
          <div className="mt-8 text-4xl font-semibold text-brand-ink">Where to next?</div>
          <div className="mt-3 text-brand-ink/70 text-lg max-w-xs">
            Add your bookings to manage, check in and stay up to date.
          </div>

          <button
            onClick={openRetrieve}
            className="mt-10 w-full max-w-sm rounded-2xl bg-brand-red text-white py-4 text-xl font-semibold shadow-card"
          >
            Retrieve Booking
          </button>
        </div>
      </div>
    </div>
  );
}
