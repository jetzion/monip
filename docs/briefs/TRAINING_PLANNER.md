# Admin Page Requirements: AI Training Planner

Source document: `monip-ai-ship-training-plan.md` (added 2026-11-12).
Review and answers: 2026-11-12. Admin only; part of the Training Schedule
(PLAN.md section 17). Cost figures are the only open item; the planner works
without them.

## Goal

Recommend a training schedule for a date range: which ships get trained,
when, by which trainer, and in which format. The admin reviews the
recommendation, edits it, accepts all or part of it, or asks for a new one.
Accepted items become ordinary training sessions. Admins can still add
sessions by hand exactly as today.

## Confirmed decisions

| Topic | Decision |
| --- | --- |
| Who changes the schedule | Only admins. The planner proposes; nothing changes until an admin accepts. |
| Goal of a plan | As much training as the trainers' limits allow. No required frequency per ship; more training means better sales. Ships trained least recently go first, so coverage spreads across ships. |
| Audience and groups | Not a planner concern. The retail team is the audience; the trainer decides how to group them. |
| Formats | Online, departure day, onboarding (as in the Training Schedule today). |
| Online timing | Only while the ship is in port: inside the start port's arrival-to-departure window on turnaround day. May change later. |
| Ships at the same port on the same day | One trainer per ship per window; windows are not split. Two ships need two trainers. With 2-3 trainers this is expected to be rare. |
| Eligible sailings | Only sailings with arrival and departure times and a start port with a known time zone (about 30% of upcoming sailings today). The plan lists ships it skipped for missing data. |
| Existing sessions | The planner may propose moving any existing session, including ones added by hand, unless the session is marked **Fixed**. Moves may be on the same day, since cruise schedules change. Past sessions are never moved. |
| Moves | Shown separately ("Move: from ... to ..."), each with its reason, accepted or rejected one by one. Each move carries a penalty so it is proposed only for a clear gain. An accepted move updates the existing session. |
| Trainer changes | Trainers tell the admin; the admin adjusts the schedule. The confirmation screen lists the trainers affected by accepted moves so the admin can inform them (no notifications in the system). |
| Plan presets | Balanced, Lower cost, More in-person. |
| Division of work | Planning code builds the plan and guarantees the hard constraints (no trainer in two places, sessions inside the port window, trainer limits). The AI turns the admin's instructions into planner settings and writes the plan summary. Every plan is re-checked by the code and, on acceptance, by the existing session conflict check. |
| Data sent to the AI | Approved: ships, ports, dates, and trainer names may be sent to the AI provider (OpenRouter, as used by the website chat). |
| New plan | "Suggest a new plan" generates a fresh recommendation that replaces the previous one. Accepted items are already sessions and stay. |
| Partial acceptance | The admin can edit proposed items (trainer, sailing, format, times) and accept any subset. Edits to items not accepted are discarded when a new plan is requested; to keep an item, accept it first. |
| Can join cruises | Per trainer, default yes; only trainers who can join cruises are offered onboarding. |
| Home base | A port from Port time zones (the nearest port for trainers who live away from one). |

## Data additions

- **Trainers**: **Home base** (a port from Port time zones), **Can join
  cruises** (yes/no, default yes), and **Maximum training days per month**
  (optional; empty means no limit), all editable on the trainer page. Home
  base decides whether a session needs travel.
- **Training sessions**: **Fixed** checkbox. The planner never proposes
  moving a fixed session.
- **Planning costs** (settings page): cost per format, per trip, and per
  night. All optional. While unknown, Lower cost ranks plans by proxies:
  online, then departure day at the trainer's home base, then departure day
  with travel, then onboarding; fewer trips and nights rank lower.
- **Current plan** (one stored plan, admin only): the settings and
  instruction used, the proposed items and moves with reasons, and the AI
  summary. Replaced by each new plan.

## Page: Training planner

`/admin/training-planner`, linked from the Training Schedule, built like the
training report page.

1. **Settings**: date range, ships (all eligible by default), preset, and an
   optional instruction in plain English (for example "favour the Miami
   ships" or "no onboarding over Christmas").
2. **Recommend** (or **Suggest a new plan**): builds the plan.
3. **Proposed sessions**: ship, format, trainer, date and time with time
   zone, port, travel needed, estimated cost (or "unknown"), and reason. Each
   row can be edited and ticked for acceptance.
4. **Proposed moves**: existing session, from and to, reason, tick to accept.
5. **Summary**: sessions by format, ships covered, ships skipped and why,
   trainer days against their monthly limits, estimated cost where known, and
   the AI's short explanation.
6. **Accept selected**: creates the ticked sessions and applies the ticked
   moves through the existing save checks, then lists anything that failed
   (for example a clash created since the plan was built) and the trainers to
   inform about moves.

## Planner rules

Hard constraints (never broken):

- A trainer is in one place at a time (the existing overlap rule); onboarding
  blocks whole days.
- A session fits the sailing's window: online and departure day inside
  arrival to departure; onboarding from cruise start to end.
- Onboarding only for trainers who can join cruises.
- Trainer monthly day limits.
- Fixed sessions and past sessions are not moved.

Preferences (weighted by the preset):

1. Train as many ships as possible, least recently trained first.
2. In-person over online (More in-person: strongly; Lower cost: weakly).
3. Fewer trips and nights away from home base (Lower cost: strongly).
4. Fewer moves of existing sessions.

Planner defaults (step 2, 2026-11-12):

- One session per ship per plan; ships with a session already in the range
  are not planned again. With about 55 ships a month and 2-3 trainers,
  trainer time runs out before ships do.
- Online sessions are 2 hours (2, 4, or 8 allowed), at the earliest free
  half hour inside the in-port window.
- Onboarding only on cruises of up to 7 nights.
- Changing port between in-person sessions needs at least 12 hours within
  a time zone and 36 hours between time zones (or when a zone is unknown);
  there is no real travel data.
- A move is proposed only when it lets an otherwise untrained ship be
  trained; one move per such ship.
- Ties go to the trainer with fewer training days that month.
- Format values: Balanced departure day 3, onboarding 2, online 1; Lower
  cost online 3, departure day 2, onboarding 0; More in-person onboarding 4,
  departure day 3, online 0. Each trip costs 1 (Balanced), 3 (Lower cost),
  or 0.5 (More in-person), a night a third of that. Known costs break ties.

## Open items

- Cost figures per format, trip, and night (MONIP to find out). The planner
  works without them using the proxies above.

## Build order

1. Data: trainer fields, Fixed on sessions, planning costs settings
   (migration, editor guide). Done 2026-11-12.
2. Planner code (`lib/training/planner/`) with unit tests: candidate slots,
   constraints, presets, moves, reasons. Done 2026-11-12.
3. Planner page: settings, proposals, moves, summary, accept selected (e2e
   tests with their own accounts).
4. AI: instruction to settings and the summary through OpenRouter (mocked in
   tests).
