"use client";

import type { Travel } from "@/lib/training/travel";

type Props = {
  travel: Travel;
  onChange: (changes: Partial<Travel>) => void;
  /** Where an onboarding cruise ends, when not where it starts. */
  endPort?: string | null;
};

type DayField = "departureDate" | "returnDate" | "hotelCheckIn" | "hotelCheckOut" | "carPickUp" | "carReturn";
type TextField = "departureCity" | "departureAirport" | "destinationAirport" | "returnAirport";
type Choice = "airTravel" | "hotel" | "carRental" | "rideshare";

/** The trainer's trip for in-person training away from home base. Dates are filled in from the training. */
export function TrainingTravelFields({ travel, onChange, endPort }: Props) {
  const day = (field: DayField, label: string) => (
    <div className="training-form__field">
      <label htmlFor={`travel-${field}`}>{label}</label>
      <input
        id={`travel-${field}`}
        type="date"
        className="training-form__time"
        value={travel[field]}
        onChange={(event) => onChange({ [field]: event.target.value })}
      />
    </div>
  );
  const text = (field: TextField, label: string, placeholder: string) => (
    <div className="training-form__field">
      <label htmlFor={`travel-${field}`}>{label}</label>
      <input
        id={`travel-${field}`}
        type="text"
        className="training-form__time"
        placeholder={placeholder}
        value={travel[field]}
        onChange={(event) => onChange({ [field]: event.target.value })}
      />
    </div>
  );
  const choice = (field: Choice, label: string) => (
    <label className="training-travel__choice">
      <input type="checkbox" checked={travel[field]} onChange={(event) => onChange({ [field]: event.target.checked })} /> {label}
    </label>
  );

  return (
    <fieldset className="training-travel">
      <legend>Travel</legend>
      <p className="training-form__hint">Dates are suggested from the training; change them as needed.</p>
      {endPort && (
        <p className="training-form__hint">
          This cruise ends in {endPort}: enter the airport the trainer flies home from under Return from airport.
        </p>
      )}
      <div className="training-travel__row">
        {text("departureCity", "Departure city", "For example Orlando, Florida")}
        {day("departureDate", "Departure date")}
        {day("returnDate", "Return date")}
      </div>
      {choice("airTravel", "Air travel needed")}
      {travel.airTravel && (
        <div className="training-travel__row">
          {text("departureAirport", "Departing airport", "For example MCO")}
          {text("destinationAirport", "Destination airport", "For example MIA")}
          {text("returnAirport", "Return from airport", endPort ? `Nearest ${endPort}` : "Same as destination")}
        </div>
      )}
      {choice("hotel", "Hotel needed")}
      {travel.hotel && (
        <div className="training-travel__row">
          {day("hotelCheckIn", "Hotel check-in")}
          {day("hotelCheckOut", "Hotel check-out")}
        </div>
      )}
      {choice("carRental", "Car rental needed (picked up at the destination airport)")}
      {travel.carRental && (
        <div className="training-travel__row">
          {day("carPickUp", "Car pick-up")}
          {day("carReturn", "Car return")}
        </div>
      )}
      {choice("rideshare", "Rideshare needed (airport to port and back)")}
    </fieldset>
  );
}
