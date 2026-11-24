# Training travel and cost estimate

Adds travel details and an estimated travel cost to **Schedule training**,
and a Trainer role that can schedule training and update rates.

Status: approved 2026-11-23; built in six steps (PLAN.md section 17), not yet
deployed. Items marked **Proposed** are the agreed defaults unless changed.

## Decisions

| Topic | Decision |
| --- | --- |
| Cost | An estimate, not a quote or booking |
| Pricing source | Firecrawl's agent looks up current typical prices (changed 2026-11-23: stored rates alone were too rough); stored rates are the fallback when nothing is found or the lookup fails |
| Flight rate | One typical return fare per destination port, with a default fare for ports without one (no route list) |
| Who schedules and updates rates | Admins and a new Trainer role (see Trainer role) |

## 1. Schedule training shows preferred ships and ports

- **Schedule training** lists only the ships and ports ticked in
  **Training preferences**.
- **Proposed:** with no preferences saved, it lists everything.
- **Proposed:** editing an existing session on a ship or port that is not
  preferred still works.

## 2. Schedule training: new process

1. Choose the cruise: Cruise line, Ship, and Port in any order (Cruise line
   first or Port first, as today); **Cruise dates** lists the matching
   cruises.
2. Choose the cruise date.
3. Choose the trainer.
4. Choose the training type.
5. Travel details (new fields; **Proposed:** shown only for Departure day and
   Onboarding training, and not needed when the trainer's home base is the
   cruise's port):
   - Departure city (**Proposed:** defaults to the trainer's home base)
   - Departure date and return date
   - Air travel needed (Yes/No); when Yes: departing airport and destination
     airport
   - Hotel needed (optional); when Yes: check-in and check-out dates
     (required)
   - Car rental needed (optional); when Yes: pick-up and return dates
     (required), picked up at the destination airport
   - Rideshare needed (optional)
6. Click **Estimate cost**.
7. The estimate appears as line items with a total (see section 3).
8. The user acknowledges the estimate; only then is **Add to Calendar**
   enabled.

**Proposed defaults:** departure date the day before training (Departure
day) or the cruise start date (Onboarding); return date the training end or
cruise end date; hotel dates match the travel dates.

**Proposed checks:** departure on or before the training starts; return on
or after it ends; hotel and car dates within the trip; check-out after
check-in, return after pick-up.

## 3. Estimate cost

| Line | Calculation | Rate |
| --- | --- | --- |
| Flight | One return fare | The destination port's flight fare, or the default fare |
| Hotel | Nights x nightly rate | The port's hotel rate, or the default **Hotel, per night** |
| Car rental | Days x daily rate | Default daily car rate |
| Rideshare | 2 trips (to the port and back) x fare | The port's rideshare fare, or a default fare |

- Each line shows which rate was used (for example "Miami rate" or
  "Default rate").
- A missing rate shows "No rate set: enter an amount"; it is never guessed.
- Every amount can be changed before acknowledging.
- Amounts are in US dollars.

**Rates** (stored in the admin, updated by admins and trainers):

- Defaults in **Training planning costs**: flight fare (the existing
  **Travel, per trip**), hotel per night (the existing **Hotel, per night**),
  **Car rental, per day**, and **Rideshare, per trip**.
- Per port in **Port time zones** (all optional): flight fare, hotel per
  night, rideshare fare.

**Proposed:** the estimate is saved with the session (line items, total,
rates used, who acknowledged it and when) and shown in the session
details.

| Topic | Decision |
| --- | --- |
| Rideshare | Both ways: one trip to the port and one back |
| Training report and PDF | Show each session's estimated total cost, and the total of all estimates |
| Travel dates | Departure to return blocks the trainer from other sessions (conflicts) |
| Planner sessions | Accepted from the planner without travel details; marked as missing them until added through Edit, with an estimate |
| Cruise changes | When "Update to current cruise details" changes the session, its estimate is redone and must be acknowledged again |
| Canceled sessions | Do not block the trainer: no conflicts, not counted in the monthly limit or by the planner |

## 4. Trainer role

A new user role, **Trainer**. Today the Training Schedule, Cruise Fleet
Schedule, training rates, planner, and report are admin only because they
are commercially sensitive; this role extends that access to trainers. They
stay off the public site, search, the sitemap, and the chat.

| Topic | Decision |
| --- | --- |
| Sessions | Trainers see every trainer's sessions |
| Scheduling | Trainers can schedule sessions for any trainer |
| Before a session starts | Trainers can edit, delete, or cancel it |
| Once a session has started | Trainers can only cancel it (no edit or delete) |
| Admins | Can edit, delete, or cancel any session at any time |
| Pages | Cruise Fleet Schedule (view only: no Import Excel or editing sailings), Training preferences, training planner, training report |
| Trainers and Port time zones | Admins only; trainers cannot manage them |
| Website content | No access for trainers (products, pages, inquiries, users, and the rest) |
| Trainer records | A trainer login is not linked to a Trainers record (trainers act on all sessions) |
| Rates | Trainers can change all rates |

**Canceled** is a new session status (until now there was none). A canceled
session stays in the schedule as a record that it did not take place.

| Topic | Decision |
| --- | --- |
| When | Any session can be canceled, before or after it starts |
| Undo | A canceled session can be un-canceled |
| Calendar | Shown greyed out |
| Training report and PDF | Listed, but left out of the totals |

## Out of scope

- Booking travel or exact live quotes (Firecrawl returns typical prices from public pages)
- Notifications to trainers

## Open questions

None. Proposed items above are taken as agreed unless changed.

## Acceptance criteria (draft)

- Schedule training lists only preferred ships and ports (all when none are
  saved).
- Travel fields appear only when travel is needed, with defaults and date
  checks as above.
- Estimate cost shows line items, the rate used for each, and a total; no
  outside calls.
- Add to Calendar stays disabled until the estimate is acknowledged.
- Travel dates block the trainer from other sessions; canceled sessions
  block nothing.
- The report and PDF show each session's estimated total and the overall
  total.
- Planner sessions show that travel details are missing until added.
- A cruise change redoes the estimate, which must be acknowledged again.
- Admins and trainers can update rates; other roles cannot.
- Trainers can schedule, edit, and delete sessions for any trainer before
  they start; once started they can only cancel them. Admins can edit,
  delete, or cancel any session at any time.
- Canceled sessions can be un-canceled, show greyed out in the calendar,
  and are listed in the report and PDF but left out of the totals.
- Trainers can view the Cruise Fleet Schedule (no import or editing), and
  open Training preferences, the training planner, and the training report;
  they cannot manage Trainers, Port time zones, or website content.
  Editors still cannot open any of these.
- No travel, rate, or estimate data appears on the public site, search, the
  sitemap, or the chat.
