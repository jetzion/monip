# Admin Page Requirements: Training Schedule Report

Original request (2026-10-27):

> Create a training schedule report. Accessible to admin only. Admin will be
> able to choose from report by
> 1. Select specific Trainer for a given timeframe (start month/year to end month/year)
> 2. All Trainers for a given timeframe (start month/year to end month/year)
>
> Report should also allow the admin to download a PDF

Answers to follow-up questions (2026-10-27):

- Rows show full session details (dates, time, time zone, training type,
  trainer, cruise line, ship, start port, cruise dates) with totals per
  trainer.
- The admin chooses the layout: grouped by trainer, or one list by date.
- The PDF is generated on the server.
- A session belongs to the timeframe when any part of it falls within it.

Decisions are recorded in PLAN.md section 17.
