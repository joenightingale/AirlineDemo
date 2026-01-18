import React from "react";
import { Icons } from "./Icons";
import { useAppStore, type Tab } from "../store";

type Item = { tab: Tab; label: string; Icon: React.ComponentType<any> };

const items: Item[] = [
  { tab: "home", label: "Home", Icon: Icons.Home },
  { tab: "trips", label: "Trips", Icon: Icons.Plane },
  { tab: "book", label: "Book", Icon: Icons.Search },
  { tab: "specials", label: "Specials", Icon: Icons.Tag },
  { tab: "more", label: "More", Icon: Icons.MoreHorizontal },
];

export function BottomNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200">
      <div className="mx-auto max-w-md px-4">
        <div className="flex items-center justify-between py-2">
          {items.map(({ tab, label, Icon }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex w-full flex-col items-center gap-1 py-2"
                aria-label={label}
              >
                <Icon className={active ? "text-brand-red" : "text-brand-ink/70"} size={22} />
                <span className={active ? "text-brand-red text-xs font-semibold" : "text-brand-ink/60 text-xs"}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
