import { localDay } from "./calendar";
import type { FieldError, TrainingType } from "./schedule";
import { addDays, dayOf, zonedTime } from "./time";

/** A trainer's trip for an in-person session. Days are "YYYY-MM-DD"; empty when not set. */
export type Travel = {
  departureCity: string;
  departureDate: string;
  returnDate: string;
  airTravel: boolean;
  departureAirport: string;
  destinationAirport: string;
  /** The airport flown home from, when not the destination airport (a cruise ending elsewhere). */
  returnAirport: string;
  hotel: boolean;
  hotelCheckIn: string;
  hotelCheckOut: string;
  carRental: boolean;
  carPickUp: string;
  carReturn: string;
  rideshare: boolean;
};

/** First and last day of the training, in the session's time zone. */
export type TrainingDays = { first: string; last: string };

export const isInPerson = (type: TrainingType | "") => type === "departureDay" || type === "onboarding";

/**
 * Travel is needed for in-person training away from the trainer's home base
 * (or with none set). Onboarding also needs it when the cruise ends at another port.
 */
export function needsTravel(type: TrainingType | "", homeBase: string | null, port: string | null | undefined, endPort?: string | null) {
  if (!isInPerson(type)) return false;
  const away = (place: string | null | undefined) => !homeBase || homeBase !== place;
  return away(port) || (type === "onboarding" && Boolean(endPort) && away(endPort));
}

/** The days a session covers, from its stored times. */
export const trainingDays = (times: { startsAt: string; endsAt: string; timeZone: string }): TrainingDays => ({
  first: localDay(times.startsAt, times.timeZone),
  last: localDay(Date.parse(times.endsAt) - 1, times.timeZone),
});

/**
 * Suggested travel: leave the day before departure-day training or on the
 * cruise start day for onboarding, return on the last training day; hotel and
 * car cover the trip.
 */
export function travelDefaults(type: TrainingType, days: TrainingDays, homeBase: string | null): Travel {
  const departureDate = type === "departureDay" ? addDays(days.first, -1) : days.first;
  return {
    departureCity: homeBase ?? "",
    departureDate,
    returnDate: days.last,
    airTravel: false,
    departureAirport: "",
    destinationAirport: "",
    returnAirport: "",
    hotel: false,
    hotelCheckIn: departureDate,
    hotelCheckOut: days.last,
    carRental: false,
    carPickUp: departureDate,
    carReturn: days.last,
    rideshare: false,
  };
}

const formatDay = (day: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));

const fail = (field: keyof Travel, message: string): FieldError => ({ path: `travel.${field}`, message });

/** What is wrong with the travel for a session on these days, or null. */
export function travelError(travel: Travel, days: TrainingDays): FieldError | null {
  if (!travel.departureCity.trim()) return fail("departureCity", "Enter the departure city.");
  if (!travel.departureDate) return fail("departureDate", "Choose the departure date.");
  if (!travel.returnDate) return fail("returnDate", "Choose the return date.");
  if (travel.departureDate > days.first) {
    return fail("departureDate", `The departure date must be on or before the training starts (${formatDay(days.first)}).`);
  }
  if (travel.returnDate < days.last) {
    return fail("returnDate", `The return date must be on or after the training ends (${formatDay(days.last)}).`);
  }
  if (travel.airTravel && !travel.departureAirport.trim()) return fail("departureAirport", "Enter the departing airport.");
  if (travel.airTravel && !travel.destinationAirport.trim()) return fail("destinationAirport", "Enter the destination airport.");
  const inTrip = (day: string) => day >= travel.departureDate && day <= travel.returnDate;
  if (travel.hotel) {
    if (!travel.hotelCheckIn || !travel.hotelCheckOut) return fail("hotelCheckIn", "Choose the hotel check-in and check-out dates.");
    if (!inTrip(travel.hotelCheckIn) || !inTrip(travel.hotelCheckOut)) return fail("hotelCheckIn", "The hotel dates must be within the trip.");
    if (travel.hotelCheckOut <= travel.hotelCheckIn) return fail("hotelCheckOut", "The hotel check-out must be after check-in.");
  }
  if (travel.carRental) {
    if (!travel.carPickUp || !travel.carReturn) return fail("carPickUp", "Choose the car rental pick-up and return dates.");
    if (!inTrip(travel.carPickUp) || !inTrip(travel.carReturn)) return fail("carPickUp", "The car rental dates must be within the trip.");
    if (travel.carReturn <= travel.carPickUp) return fail("carReturn", "The car rental return must be after pick-up.");
  }
  return null;
}

/** When the trainer is busy: the session, widened to whole travel days in the session's time zone. */
export function blockedRange(times: { startsAt: string; endsAt: string; timeZone: string }, travel: Travel | null) {
  if (!travel?.departureDate || !travel.returnDate) return { blockedFrom: times.startsAt, blockedTo: times.endsAt };
  const leave = zonedTime(travel.departureDate, "00:00", times.timeZone).toISOString();
  const back = zonedTime(addDays(travel.returnDate, 1), "00:00", times.timeZone).toISOString();
  return {
    blockedFrom: leave < times.startsAt ? leave : times.startsAt,
    blockedTo: back > times.endsAt ? back : times.endsAt,
  };
}

const text = (value: unknown) => (typeof value === "string" ? value : "");
const day = (value: unknown) => (typeof value === "string" && value ? dayOf(value) : "");

/** Travel from a stored or submitted session (dates as ISO strings), or null when none was entered. */
export function readTravel(value: unknown): Travel | null {
  const input = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  if (!input.departureDate && !input.returnDate && !input.departureCity) return null;
  return {
    departureCity: text(input.departureCity),
    departureDate: day(input.departureDate),
    returnDate: day(input.returnDate),
    airTravel: Boolean(input.airTravel),
    departureAirport: text(input.departureAirport),
    destinationAirport: text(input.destinationAirport),
    returnAirport: text(input.returnAirport),
    hotel: Boolean(input.hotel),
    hotelCheckIn: day(input.hotelCheckIn),
    hotelCheckOut: day(input.hotelCheckOut),
    carRental: Boolean(input.carRental),
    carPickUp: day(input.carPickUp),
    carReturn: day(input.carReturn),
    rideshare: Boolean(input.rideshare),
  };
}

const noon = (value: string) => (value ? `${value}T12:00:00.000Z` : null);

/** Travel as the session stores it: dates at noon UTC, unused details cleared. */
export function travelData(travel: Travel) {
  return {
    departureCity: travel.departureCity.trim(),
    departureDate: noon(travel.departureDate),
    returnDate: noon(travel.returnDate),
    airTravel: travel.airTravel,
    departureAirport: travel.airTravel ? travel.departureAirport.trim() : null,
    destinationAirport: travel.airTravel ? travel.destinationAirport.trim() : null,
    returnAirport: travel.airTravel && travel.returnAirport.trim() ? travel.returnAirport.trim() : null,
    hotel: travel.hotel,
    hotelCheckIn: travel.hotel ? noon(travel.hotelCheckIn) : null,
    hotelCheckOut: travel.hotel ? noon(travel.hotelCheckOut) : null,
    carRental: travel.carRental,
    carPickUp: travel.carRental ? noon(travel.carPickUp) : null,
    carReturn: travel.carRental ? noon(travel.carReturn) : null,
    rideshare: travel.rideshare,
  };
}

/** Empty travel, stored for online sessions and sessions without a trip. */
export const NO_TRAVEL = {
  departureCity: null,
  departureDate: null,
  returnDate: null,
  airTravel: false,
  departureAirport: null,
  destinationAirport: null,
  returnAirport: null,
  hotel: false,
  hotelCheckIn: null,
  hotelCheckOut: null,
  carRental: false,
  carPickUp: null,
  carReturn: null,
  rideshare: false,
};

/** "MCO – MIA", or "MCO – MIA, return from BCN" when flying home from another airport. */
export const flightRoute = (travel: Travel) =>
  `${travel.departureAirport} – ${travel.destinationAirport}${
    travel.returnAirport && travel.returnAirport !== travel.destinationAirport ? `, return from ${travel.returnAirport}` : ""
  }`;

const span = (from: string, to: string) => (from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`);

/** The trip as lines for the session details. */
export function travelSummary(travel: Travel): string[] {
  return [
    `From ${travel.departureCity}, ${span(travel.departureDate, travel.returnDate)}`,
    travel.airTravel ? `Flight ${flightRoute(travel)}` : "",
    travel.hotel ? `Hotel ${span(travel.hotelCheckIn, travel.hotelCheckOut)}` : "",
    travel.carRental ? `Car rental ${span(travel.carPickUp, travel.carReturn)}` : "",
    travel.rideshare ? "Rideshare to the port and back" : "",
  ].filter(Boolean);
}
