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

## Website chat

The chat assistant, Mike, opens from the "Chat with us" button at the bottom right of every page. It answers visitor questions using only published content: products, services, the About page, the client list, and the offices. Keeping that content accurate keeps the chat accurate. It does not quote prices, lead times, or minimums; it sends visitors to the contact form instead. Contact-form suggestions appear as a "Contact us" link. Each reply is marked "AI" next to Mike's name. Conversations are not saved.

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
| Cannot see Inquiries or Users | Those are admin-only. Ask an admin. |
| A "<No Name>" item appears in a list | Opening **Create New** saves an empty draft straight away. If you left without filling it in, open it and delete it. Empty drafts never appear on the site. |
