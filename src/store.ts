import { create } from "zustand";

export type Passenger = {
  id: string;
  firstName: string;
  lastName: string;
  loyaltyPoints: number;
};

export type Airport = {
  code: string;
  city: string;
  country: string;
};

export type Flight = {
  id: string;
  flightNumber: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  boardingGate?: string | null;
};

export type Booking = {
  pnr: string;
  status: "CONFIRMED" | "CANCELLED" | "FLOWN" | "PENDING";
  flight: Flight;
};

export type Tab = "home" | "trips" | "book" | "specials" | "more";

export type WsStatus = "disconnected" | "connecting" | "connected" | "error";

export type NotificationItem = {
  id: string;
  eventType: "flight.changed";
  title: string;
  message: string;
  occurredAt: string;
  correlationId?: string;
  payload: {
    passengerId: string;
    bookingPnr: string;
    flightId: string;
    flightNumber: string;
    change: { field: string; oldValue?: string | null; newValue: string };
  };
};

type AppState = {
  activeTab: Tab;
  passenger: Passenger | null;
  booking: Booking | null;

  retrieveModalOpen: boolean;

  wsStatus: WsStatus;

  notifications: NotificationItem[];

  setActiveTab: (tab: Tab) => void;
  setPassenger: (p: Passenger) => void;
  setBooking: (b: Booking | null) => void;

  openRetrieveModal: () => void;
  closeRetrieveModal: () => void;

  setWsStatus: (s: WsStatus) => void;

  addNotification: (n: NotificationItem) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: "home",
  passenger: null,
  booking: null,

  retrieveModalOpen: false,

  wsStatus: "disconnected",

  notifications: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setPassenger: (p) => set({ passenger: p }),
  setBooking: (b) => set({ booking: b }),

  openRetrieveModal: () => set({ retrieveModalOpen: true }),
  closeRetrieveModal: () => set({ retrieveModalOpen: false }),

  setWsStatus: (s) => set({ wsStatus: s }),

  addNotification: (n) =>
    set((st) => ({ notifications: [n, ...st.notifications].slice(0, 5) })),
  dismissNotification: (id) =>
    set((st) => ({ notifications: st.notifications.filter((x) => x.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
}));
