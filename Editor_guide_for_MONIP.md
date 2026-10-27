# MONIP Website Editor Guide

Oct 24, 2026 · @Jack

## Getting started

All website content is managed in the admin, a password-protected area of the site. You never need to edit code.

While the site is in development, the admin is at http://localhost:3000/admin on the developer's computer. The live address will be added here after launch.

**Accounts.** The first account created becomes an admin. Admins add everyone else under **Users**, and choose a role for each person.

| Role | Can do | Cannot do |
| --- | --- | --- |
| Admin | Everything editors can, plus manage users and read website inquiries | — |
| Editor | Create, edit, preview, publish, and unpublish products, categories, services, client logos, success stories, offices, pages, the Home page text, and images | See other users, change roles, or read inquiries |

You can change your own name and password from your account page. Only an admin can change someone's role.

## Adding and editing a product

A product needs a name, a summary, a main image, and a category before it can be published. Everything else is optional.

1. Open **Products** and click **Create New**.
2. Enter the **Name**. Leave **Slug** (right sidebar) empty and it is created from the name, for example "Steel Travel Mug" becomes /products/steel-travel-mug.
3. Fill in the three tabs described below. Your work saves automatically as a draft.
4. Preview and publish (next section).

**Copying a product.** To start from a similar product, open it, click the **⋯** menu next to **Publish changes**, and choose **Duplicate**. The copy opens as a draft named "... (copy)" with the slug "...-copy", so it is not on the site until you publish it. It keeps all content and images, but is not featured. Change the name and slug before publishing; clear the slug to regenerate it from the new name.

**Content tab**

- **Summary** (required, up to 200 characters): one or two sentences shown on product cards and at the top of the product page.
- **Description**: the full text. Use headings and lists from the toolbar or by typing "/".
- **Write description with AI**: drafts the Description from the photos and details entered so far. It replaces the current Description but saves nothing; read it, correct anything inaccurate, then save. The button is greyed out until you add a photo or some details.
- **Primary image** (required): the main photo on cards and the product page.
- **Gallery**: extra photos, shown in the order you drag them into.

**Details tab**

- **Category** (required): only top-level categories can be chosen here.
- **Subcategory**: appears once a category is chosen and lists only that category's subcategories.
- **Tags, Materials, Customization options, Industries / applications**: type a value and press Enter, then add the next one.
- **Labels**: "New" or "Sustainable". Apply them only when accurate and approved.
- **Specifications**: rows of label and value, for example "Dimensions" and "10 x 8 cm". Public information only.

**SEO tab** (optional): the title and description search engines show. Left empty, the product name and summary are used.

**Sidebar**: tick **Featured** to show the product on the homepage, which shows the three most recently published featured products. **Published At** is filled in automatically on first publish.

| Field | Where visitors see it |
| --- | --- |
| Summary | Product cards, top of the product page |
| Materials, customization, industries, specifications | The Specifications list on the product page |
| Tags | Not shown; used by the catalog search |
| Category and subcategory | Card label, Specifications list, catalog filters |

**Images.** Every image needs alt text, a short description of what it shows for people using screen readers, such as "Stainless steel travel mug with black lid". Landscape photos work best: product cards crop images to a 4:3 shape. You can upload from the image field (**Create New**) or in **Media**.

**Changing the slug after publishing breaks existing links** to that product, including links already shared or indexed by search engines. Ask the developer to add a redirect if a slug must change.

## Previewing and publishing

Nothing reaches visitors until you click **Publish changes**. Edits save automatically as a draft that only logged-in users can see.

**Live Preview.** Click the eye icon next to **Publish changes** to open the real page beside the form. It updates about a second after you stop typing. Switch between Mobile, Tablet, and Desktop sizes at the top of the preview. A yellow "Preview mode" banner reminds you it shows unpublished content; click **Exit preview** to leave it in a normal browser tab.

**Status** (top of the edit screen) tells you what visitors see:

| Status | Meaning | What visitors see |
| --- | --- | --- |
| Draft | Never published | Nothing; the page shows "Page not found" |
| Published | Live, no pending edits | The published version |
| Changed | Live, with unpublished edits | The previous published version until you publish again |

**Publish.** Click **Publish changes**. The product page, catalog, homepage, and sitemap update within a few seconds.

**Unpublish (archive).** Click **Unpublish** next to the status. The product disappears from the catalog, search, homepage, and sitemap, and its address shows "Page not found". It stays in the admin and can be published again at any time. Prefer unpublishing to deleting: deleting is permanent.

**Undo changes.** Click **Revert to published** to discard draft edits, or open the **Versions** tab to see and restore earlier versions.

## Categories, services, and pages

Services and pages use the same draft, preview, and publish steps as products. Categories have no drafts: changes go live as soon as you save.

**Categories.** Each category has a title, an optional description and image, and a **Sort order** (lower numbers appear first in the catalog filters). Set a **Parent** to make it a subcategory; there are two levels at most. The Categories list shows each top-level category with its subcategories indented underneath; click the arrow to hide or show them, and click a name to edit it. Searching or filtering switches back to a plain table. A product's **Category** must be a top-level category, so giving a category a parent breaks every product that uses it as its Category: those products cannot be saved until you set their Category to the new parent and their Subcategory to the moved category. Before deleting a category, move its products to another one, or those products cannot be saved until a new category is chosen.

**Services.** Each service is a section on the Services page, ordered by **Sort order**, with a required **Summary** plus optional body text and image. The Services page and its menu link appear once at least one service is published.

**Home page.** Open **Home page** (under Globals) to change the homepage text: the headline, intro, About link label, and the closing call to action. Where the links go is fixed. Edits save as a draft with Live Preview; click **Publish changes** to update the site. Featured products are chosen with the **Featured** checkbox on each product.

**Products page header.** Open **Pages** and the "Products" entry to change the title and the intro text at the top of the Products catalog. The catalog itself is always shown; without a published Products entry it shows the title "Products" and no intro.

**About, Our clients, and Privacy policy.** Open **Pages**, click **Create New**, and choose which page it is in the **Page** field (each can exist only once). Add a title, a short intro, an optional photo (shown below the intro and used when the page is shared), and the body text. A page and its link (in the main menu, or the footer for Privacy policy) appear only once it is published.

**Client logos.** Open **Clients** to add, remove, or reorder the logos on the Our clients page. Each needs the client name and a logo (give the logo image alt text such as "MSC Cruises logo"). The list shows each logo and is in page order: drag the ⠿ handle on the left of a row to move it, and the page updates straight away. You can also reorder with the keyboard: focus the handle, press Space, use the arrow keys, then press Space again. Show only clients MONIP has approval to name.

**Success stories.** Open **Success stories** to add a story. Each needs a title, a short summary (shown on the card and under the title), and a featured photo; add the full story (for example: the challenge, the solution, and the result) and any extra photos. On the **Details** tab you can add an industry and the customer's name, but the name appears on the site only when **Customer approved for public display** is ticked: tick it only with MONIP's written approval. Drag the ⠿ handle to set the order. Each story gets its own page (preview it while editing). The page header (title, headline such as "Turning Ideas Into Results", and intro) is edited in **Pages** under "Success Stories". The menu link appears once that page and at least one story are published. Use only real, approved projects, photos, and results.

**Offices.** Open **Offices** to add, remove, or reorder the offices on the About page map and list. Each needs a name and its map position: in Google Maps, right-click the place and click the two numbers to copy them, then paste the first into **Latitude** and the second into **Longitude**. The street address is optional. To change the order, set **Sort order** in the sidebar: lower numbers appear first.

## Reading website inquiries

Every form submission is saved under **Inquiries**, newest first, and only admins can see it. Product inquiries record the product's name and link as they were when the visitor wrote.

- **Reply** by email to the visitor's address. MONIP's notification email is set so that replying goes straight to the visitor.
- **Email status** shows whether MONIP's notification email was sent. "Failed" means nobody was emailed, so check the admin for those inquiries.
- Inquiries are a read-only record and cannot be edited.
- Inquiries contain personal details. Delete ones you no longer need.

Until the email service is set up, notification emails are not delivered: check **Inquiries** in the admin regularly.

## Cruise Fleet Schedule (admins only)

**Cruise Fleet Schedule** lists every cruise sailing from the fleet calendar workbook. Only admins can see it; it never appears on the website or in the chat.

- **Filter** with Port (the start port), Month, Date, Cruise line, Operator, and Ship. Filters combine: a sailing must match all of them. Once a cruise line is chosen, Ship lists only that line's ships. **Clear filters** shows everything again.
- **Sort** by clicking a column heading; click again to reverse.
- **Show the long columns:** Ports in order and Source are hidden at first, and **Hide Ports in order and Source** is ticked. Untick it to show those two columns; tick it to hide them again.
- **Sailings without times:** **Hide sailings without arrival and departure times** is ticked at first, so the list shows only sailings that have both times. Untick it to see every sailing. Your choice is remembered.
- **Rows per page:** 10 by default; change it with the per-page menu below the table. Your choice is remembered the next time you open the schedule.
- **Open a sailing** by clicking its cruise line to see every field in full. Admins can correct a sailing there, add one with **Create New**, or delete one.
- **Add or update sailings in bulk:** click **Download Excel Template**, fill in one row per sailing without renaming the sheet or columns (dates as 2026-10-03, times as 06:00), then click **Import Excel** and choose the file. A summary shows how many sailings were added, updated, unchanged, or rejected, with the row number and reason for each rejected row. Files must be .xlsx and at most 4 MB (the template holds about 25,000 sailings in under 2 MB). If anything goes wrong while saving, nothing is changed.
- **Updating the data:** an import matches sailings by Ship and Start date. It updates sailings that changed, adds new ones, and keeps sailings that are not in the file. Rows with a missing ship, cruise line, or start date are reported and skipped.

## Training Schedule (admins only)

**Training Schedule**, directly below Cruise Fleet Schedule, is where admins schedule product training for cruise personnel. Each session has one cruise, one trainer, and a training type. Only admins can see it; it never appears on the website or in the chat.

**Before you start**

- **Trainers:** click **Manage trainers** (or open **Trainers** in the menu) to add, edit, or remove trainers; each needs a first and last name. A trainer with scheduled sessions cannot be removed until those sessions are moved to another trainer or deleted.
- **Port time zones:** departure-day and onboarding sessions use the time zone of the cruise's start port. **Port time zones** lists each start port, spelled exactly as in the Cruise Fleet Schedule, with its time zone (for example "America/New_York"). It was filled in for every port in the schedule; when an import brings a new port, add it here. If a port is missing, the form says which one to add.

**Schedule a session** with the form at the top of the page:

1. Choose the cruise with **Cruise line**, **Ship**, **Port**, and **Cruise dates**. Each list narrows to the choices above it. Choosing a ship fills in its cruise line, and its port when it sails from only one. **Cruise dates** lists that ship's sailings from that port starting today or later, with arrival and departure times when known.
2. Choose the **Trainer**.
3. Choose the **Training type**:
   - **Online training:** pick the date, start time, time zone, and duration (2, 4, or 8 hours).
   - **Departure day training:** runs on the cruise's start date, from its arrival to its departure time, in the port's time zone. You cannot change these times. Not available for cruises without both times.
   - **Onboarding training:** runs every day from the cruise's start date to its end date. You can choose an earlier or later end date, but not one before the start.
4. Check the line next to **Add to Calendar**: it shows the session as it will be saved, or what is still missing. The button works only when everything is filled in correctly.
5. Click **Add to Calendar**. A confirmation appears and the form clears. If it cannot be saved, the reason appears below and your choices are kept.

**Conflicts:** a trainer cannot have two sessions that overlap, counting time zones (09:00 in London is 04:00 in New York). Onboarding blocks whole days. Back-to-back sessions are fine: one may start when another ends. A clash is refused with the session it clashes with.

**The calendar**

- Shows one month; use the **Previous month**, **This month**, and **Next month** buttons. Each session shows its start time (or "All day"), type, trainer, and ship, colored by type. Onboarding appears on every day it covers.
- Times are shown in each session's own time zone, which the details name.
- **Filter** by Trainer, Cruise, and Training type; **Clear filters** shows everything again.
- **Click a session** to see its full details, with **Edit**, **Delete** (asks first), and **Close**. Editing opens the session's own page; saving checks for conflicts again.
- On a phone, the calendar becomes a list of the days that have sessions.

**When a cruise changes:** if a sailing's dates, times, port, or ship change after training is scheduled (for example through an Excel import), or the sailing is deleted, the session is not changed. Instead a "Cruise changed" box at the top lists every session to review, the session shows **Review** in the calendar, and its details list what changed (for example "Departure: 16:00 → 18:00"). Then either:

- click **Update to current cruise details** to move the session to the cruise's new dates and times (conflicts are checked again);
- **Edit** it, for example to choose another cruise when the original was removed; or
- **Delete** it.

**Training report:** click **Training report** below the page title (or go to `/admin/training-report`).

1. Choose a **Trainer**, or leave it on **All trainers**.
2. Choose the **From** and **To** months. A session is included when any of its days falls in those months, so onboarding that starts in the previous month still appears.
3. Choose the **Layout**: **Group by trainer** (a section per trainer, alphabetical by last name, each with its own totals) or **List by date** (one list with a Trainer column).
4. The report updates as you choose. Each line shows the dates, time, time zone, training type, cruise line, ship, start port, and cruise dates; totals count sessions, hours of online and departure-day training, and days of onboarding (whole sessions).
5. Click **Download PDF** for the same report as a PDF file (US Letter, landscape), marked confidential.

## Website chat

The chat assistant, David, opens from the "Chat with us" button at the bottom right of every page. It answers visitor questions using only published content: products, services, the About page, the client list, and the offices. Keeping that content accurate keeps the chat accurate. It does not quote prices, lead times, or minimums; it sends visitors to the contact form instead. Contact-form suggestions appear as a "Contact us" link. Each reply is marked "AI" next to David's name. Conversations are not saved.

## Content rules

Publish only accurate, approved information; anything on the site is a public claim by MONIP.

- **Claims.** Do not publish client names, logos, testimonials, statistics, or certifications without approval.
- **Sustainability claims.** State only what MONIP can back up, such as specific materials, programs, or named certifications. Avoid general terms like "eco-friendly" on their own, and use the "Sustainable" label only when it is substantiated.
- **Confidential information.** Never enter supplier names, internal costs, private notes, or unapproved pricing or lead times. The admin is not a private store: every product field can appear on the site.
- **Images.** Use authentic, approved photos of the actual sample. Do not edit them in ways that change how the product looks.
- **Placeholders.** The development site contains items marked "Placeholder" (products, categories, services, and pages). Replace or delete every one before launch.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Publish button shows an error | A required field is empty: Name, Summary, Primary image, or Category. The field is highlighted in red. |
| Subcategory list is empty | Choose a category first; only its own subcategories are listed. |
| "The following field is invalid: Category" | The product's category has been made a subcategory. Choose its parent as the Category and the old category as the Subcategory. |
| "Value must be unique" on Slug | Another product already uses that address. Change the slug, for example add the size or color. |
| My change is not on the site | Check the status says Published, not Changed. Then reload the page. |
| A page or menu link is missing | Pages, Services, and their links appear only once something is published there. |
| Live Preview shows "Log in to the admin" | Your session expired. Log in again, then reopen the preview. |
| A product page shows "Page not found" | The product is unpublished, or its slug changed. |
| Cannot see Inquiries, Users, Cruise Fleet Schedule, or Training Schedule | Those are admin-only. Ask an admin. |
| "This trainer is already booked" | The trainer has a session that overlaps. Choose another trainer or time, or change the other session first. |
| "No time zone for start port …" | Add the port under **Port time zones**, spelled exactly as shown, then try again. |
| Departure day training is not available | The cruise has no arrival or departure time in the Cruise Fleet Schedule. Add the times to the sailing, or choose another training type. |
| A trainer cannot be deleted | They still have scheduled sessions. Move those sessions to another trainer or delete them first. |
| "Cruise changed — review" | The cruise was changed or removed after the session was scheduled. Open the session from the box and update, edit, or delete it. |
| A "<No Name>" item appears in a list | Opening **Create New** saves an empty draft straight away. If you left without filling it in, open it and delete it. Empty drafts never appear on the site. |
