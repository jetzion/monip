# Admin Page Requirements: Training Schedule

## Goal

Add an admin-only page titled **Training Schedule** directly below **Cruise Fleet Schedule** in the admin navigation. Admins use it to schedule product training for cruise personnel.

Use the existing Cruise Fleet Schedule as the source of cruise records, and follow its admin-page styling and navigation patterns.

## Page layout

The page must include:

1. A training scheduling form.
2. A monthly calendar showing scheduled training sessions.
3. Admin controls to manage trainers and scheduled sessions.

## Scheduling form

### Cruise

- Require exactly one cruise per training session.
- Let the admin select a cruise from the Cruise Fleet Schedule using a checkbox or another single-select control.
- Show enough cruise details to distinguish cruises, including ship, cruise line, and start and end dates.

### Trainer

- Provide a dropdown populated from the trainer list.
- Display each trainer’s first and last name.
- Require one trainer before adding a session.
- Let admins add, edit, and remove trainers.
- Trainer records only need first and last name.

### Training type

Require the admin to select one of these types:

**Online training**

- The admin selects a date, start time, and time zone.
- The admin selects a duration of 2, 4, or 8 hours.
- Use the selected time zone when displaying the session and checking for trainer conflicts.

**Departure day training**

- The session date is the selected cruise’s start date.
- The session runs from the cruise’s arrival time to its departure time.
- Set the session date and times from the selected cruise record; admins cannot change them in the training form.

**Onboarding training**

- The session starts on the selected cruise’s start date.
- Default the end date to the cruise’s end date, and let the admin override it.
- Require the end date to be on or after the start date.
- Display the session across its full date range.

### Add to calendar

- Provide an **Add to Calendar** button.
- Enable it only when all required fields are valid.
- Before saving, check that the selected trainer has no overlapping session. Reject conflicting sessions and explain the conflict to the admin.
- When selected, create one training schedule entry linked to the selected cruise and display it on the calendar.
- After a successful save, clear the form and show a confirmation.
- If saving fails, show an error and retain the form values.

## Calendar

- Display scheduled training in a monthly calendar.
- Include controls to move to the previous month, next month, and current month.
- Show each entry’s training type, trainer, and ship.
- Show multi-day onboarding sessions across their full date range.
- Provide filters for trainer, cruise, and training type.
- Selecting an entry should show its full details.
- Let admins edit and delete entries.
- Recheck trainer conflicts when an entry is edited.

## Data and validation

Each training schedule entry must store:

- A reference to exactly one cruise
- A reference to one trainer
- Training type
- Start date and time
- End date and time, or duration, as applicable
- Time zone for timed sessions
- Creation and last-updated timestamps

Prevent invalid or incomplete entries from being saved. Handle cruises or trainers that have been removed so existing schedule entries remain understandable.

If a cruise’s dates or times change after training is scheduled, do not silently change the existing session. Let an admin review and modify the session.

## Admin access

- Restrict the page, trainer management, and session management controls to admins.
- Place **Training Schedule** directly below **Cruise Fleet Schedule** in the admin navigation.

## Decisions (confirmed 2026-10-27)

- **Port time zones:** departure-day and onboarding sessions use the start port's time zone. An admin-only **Port time zones** list maps each start port name, spelled exactly as in the Cruise Fleet Schedule, to a standard time zone (for example America/New_York). It is pre-filled for the current ports and checked by an admin. If a cruise's start port has no time zone, departure-day and onboarding training cannot be scheduled for it, and the form says which port to add.
- **Cruises without times:** departure-day training is not available for a cruise without both an arrival and a departure time.
- **Conflicts:** any overlap between two sessions for the same trainer is a conflict. An onboarding session blocks whole days, from the start of its first day to the end of its last day in the port's time zone. Back-to-back sessions (one ends at 12:00, the next starts at 12:00) are allowed. There is no buffer between sessions.
- **Removed trainers:** a trainer with scheduled sessions cannot be removed until those sessions are reassigned or deleted.
- **Changed or removed cruises:** each session keeps a copy of the cruise details it was scheduled against. If the cruise record later differs (ship, cruise line, dates, start port, arrival, or departure) or no longer exists, the session is flagged "Cruise changed — review": a banner lists every flagged session, the calendar entry shows "Review", and the details list each change. The session itself is not changed. An admin clears the flag with **Update to current cruise details** (times recalculated, conflicts rechecked), by editing the session (choosing another cruise when the cruise was removed), or by deleting it.
- **Calendar times:** each session is shown in its own time zone, with the zone named.
- **Cruise selection:** four searchable dropdowns: Cruise line, Ship, Port (start port), and Cruise dates. Each narrows to the choices above it; choosing a ship sets its cruise line, and its port when it sails from only one. Cruise dates lists the ship's sailings from that port starting today or later (changed 2026-10-27 from a single search field).
- **Calendar:** a monthly grid built in the project, without a calendar library.
- **Not included:** trainer notifications, calendar export (.ics), a cancelled status, session notes, and editor access.
