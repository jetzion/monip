# Monip Group: AI-Assisted Ship Training Plan

## Purpose

Create a practical training schedule across eligible ships, trainers, ports, and sailing dates. The AI should recommend a feasible plan that balances training effectiveness, cost, trainer travel, and ship priorities. A user reviews and adjusts the recommendation before it becomes a confirmed schedule.

## Planning scope

Only include ships with usable port-time information in the selected planning window. A ship is eligible when its port calls include dates, times, and locations sufficient to check whether training can take place. Flag ships with incomplete information so the user can correct the data; do not silently schedule them.

The plan can use three training formats:

1. **Online training** — instructor-led Zoom training while the ship is in port. It is the least expensive option, but generally less effective than in-person training.
2. **Departure-day training** — in-person training at port while the ship is alongside, scheduled to finish before departure. It is usually less expensive than onboard training, assuming no air travel is needed.
3. **Onboard training** — the trainer joins the cruise and delivers in-person training while the ship is at sea. It is generally the most effective and the most expensive option.

## User controls

The user should set the following controls for each planning run. Defaults can be provided for routine choices, while important trade-offs remain visible.

| Control | User choice | Suggested default |
|---|---|---|
| Planning window | Start and end dates | Dates selected by the user |
| Ships | Select eligible ships or include all eligible ships | All eligible ships |
| Ship priority | Rank ships, mark priority ships, or set deadlines | No extra priority unless provided |
| Training requirements | Topic, audience, session length, required format, and number of sessions per ship | Use each ship’s recorded requirements |
| Effectiveness | How strongly to favor in-person training over online | Prefer in-person when practical |
| Budget | Maximum total spend, target spend, or minimize cost | Minimize cost without compromising required coverage |
| Travel | How strongly to reduce trainer travel, travel time, and overnight stays | Reduce travel where feasible |
| Trainer assignment | Preferred trainer, trainer exclusions, or automatic assignment | Automatic assignment among qualified trainers |
| Scheduling flexibility | Allowed times within port calls, buffer before departure, and whether sessions may be split | Use available port windows and required safety buffers |
| Unscheduled work | What to do if all requirements cannot fit | Show gaps and ask for a decision |

For unscheduled work, the user can allow the AI to extend the planning window, use online training, add trainers, or leave the item open for manual resolution. The AI should not assume any of these changes without showing them.

## Information the planner needs

### Ship and port data

- Ship identifier and name
- Port calls within the planning window, including local arrival and departure times
- Port location and time zone
- Training requirements, audience, session duration, and completion deadline
- Whether the ship can accommodate onboard training during a sailing
- Operational restrictions, blackout periods, and minimum turnaround or pre-departure buffers

### Trainer data

- Trainer identity, qualifications, and training topics they can deliver
- Availability and existing commitments
- Home or current location, travel limits, and ability to join a cruise
- Any trainer-specific preferences or restrictions

### Cost and travel data

- Cost estimates by training format
- Travel, lodging, and other expenses where applicable
- Travel time and feasible connections between locations or port calls
- Any rules for reimbursement or cost estimation

When a value is unknown, the planner should mark it as an assumption or data gap and show how it affects the recommendation.

## Scheduling rules

### Hard constraints

The AI must satisfy these before comparing schedules:

- A trainer can be in only one place at a time, including time needed to travel between assignments.
- A session must fit inside the applicable port window or onboard sailing period.
- A departure-day session must end before the ship’s departure, with the configured buffer.
- The trainer must be qualified, available, and able to reach the assignment in time.
- User-locked dates, trainers, formats, and ship priorities must be respected unless the user explicitly unlocks them.
- The plan must use local time zones consistently and identify the time zone for each proposed session.

### Optimization preferences

Among feasible schedules, rank plans using the user’s selected priorities:

1. Meet required deadlines and manual ship priorities.
2. Cover as many required training needs as possible.
3. Favor in-person training when feasible, reflecting its greater effectiveness.
4. Stay within the budget or minimize estimated total cost.
5. Reduce trainer travel, travel time, and avoidable overnight stays.
6. Avoid fragmented schedules and unnecessary gaps between assignments.

The user’s settings determine the relative weight of effectiveness, cost, and travel. Do not hide trade-offs inside a single opaque score: provide the totals and explain the main reasons for the selected formats and assignments.

## Recommended workflow

1. **Collect the planning inputs.** Load ship port calls, training requirements, trainer availability and qualifications, and cost and travel estimates.
2. **Check data quality.** Identify missing port times, unclear time zones, incomplete training durations, and unknown trainer availability. Ask the user to resolve critical gaps or proceed with clearly labeled assumptions.
3. **Apply user controls.** Confirm the planning window, ships, priorities, budget, effectiveness and travel preferences, and any locked assignments.
4. **Build feasible options.** Match each requirement to eligible training windows, qualified trainers, and allowed formats. Include travel time when checking trainer conflicts.
5. **Compare candidate plans.** Rank feasible plans against the chosen priorities. Generate alternatives when the trade-off is meaningful, such as a lower-cost plan and a plan with more in-person training.
6. **Present the recommendation.** Explain assignments, costs, travel, unscheduled requirements, and assumptions in a form the user can review.
7. **Incorporate edits and confirm.** Let the user change or lock assignments, then recalculate conflicts and totals before the schedule is finalized.

## Recommended plan format

For each proposed session, show:

| Field | Description |
|---|---|
| Ship | Ship name or identifier |
| Priority or deadline | User priority and required completion date, if set |
| Training | Topic and intended audience |
| Format | Online, departure-day in person, or onboard in person |
| Trainer | Assigned qualified trainer |
| Date and time | Start and end, with local time zone |
| Port or sailing | Port location or sailing period |
| Travel | Expected travel time, connections, and overnight stays where known |
| Estimated cost | Training and associated travel expenses |
| Rationale | Why this trainer, window, and format were recommended |

Include a summary with:

- Ships and training requirements covered, deferred, or unscheduled
- Total estimated cost and budget status
- Online versus in-person session counts
- Trainer travel time and major travel legs
- Conflicts avoided and any remaining constraints
- Data gaps and assumptions that could change the plan
- Alternatives and the cost, effectiveness, or travel trade-offs they make

## Example recommendation choices

When the user’s preferences support it, the AI could present:

- **Balanced plan:** Meets priorities and deadlines, favors in-person training, and limits avoidable travel and cost.
- **Lower-cost plan:** Uses more online sessions where port windows or travel make in-person training expensive.
- **More in-person plan:** Maximizes departure-day and onboard sessions, with higher expected travel or training costs.

These are comparison views of the same requirements and constraints. The user chooses which recommendation to edit and confirm.

## Success criteria

A useful recommendation:

- Schedules only eligible ships with valid port-time data.
- Has no trainer, travel, or ship-window conflicts.
- Respects manual priorities, deadlines, and locked choices.
- Makes the effectiveness, cost, and travel trade-offs clear.
- Identifies every unscheduled requirement and the reason it could not be placed.
- Can be reviewed and changed by the user before confirmation.

## Decisions after review (2026-11-12)

The answers to the review questions are recorded in
`docs/briefs/TRAINING_PLANNER.md`. In short: the planning code builds each
plan and guarantees the hard constraints, and the AI turns the admin's
instructions into settings and summarizes the plan. Only admins change the
schedule. Plans may propose moving existing sessions (except sessions marked
Fixed, and past ones). Online training is only while the ship is in port.
Trainers get a home base and an optional monthly day limit. A new plan
replaces the previous one, and the admin can accept any part of a plan. Cost
figures are still to be provided.
