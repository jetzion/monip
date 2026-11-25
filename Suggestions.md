# Home Page Suggestions

Ideas to make the home page (https://monip-group.vercel.app/) more attractive,
modern and engaging.

**Status (checked 2026-11-25):** each item is marked **Done**, **Partly done**
or **Not started**.

**Current state:** a navy hero (video or slideshow) with "Explore products" and
"Discuss a project" buttons, then a scrolling client logo strip, the "How we
work" loop, a success story spotlight and a featured products carousel, each
section on its own coloured band. Still missing: the global reach band, a
stats row and a closing call to action.

## Part 1: Layout and content

### Quick wins

1. **Done (2026-11-25).** **Give the hero real buttons.** The only action in the hero is a text link
   to About. Add a gold primary button ("Explore products") and an outlined
   secondary button ("Discuss a project").
2. **Partly done.** **Fix the visible placeholders** (in the admin):
   - Service links point to `#placeholder-service-1/2/3` and the cut-off
     `#progra`. *Fixed, except the Design service: its link is still the
     typo `#service-deign`.*
   - Product URLs include `test-1` and `placeholder-product-1-copy`. *Fixed.*
   - Alt texts such as "[Design]" and "[sun glasses -man]". *Still live,
     also "[Charm]", "[Sales & marketing]", "[Sustainability]", "[product
     sourcing]" and "[set of fish keychain]".*
3. **Partly done.** **Make product names and photos consistent.** "Sun glasses - man" sits next
   to "Touch of Luxury Rings". Use one naming style, and shoot products on the
   same background in the same light. *Most names now follow "Category -
   Name" (for example "Earrings - Classic Allure"); "Sunglasses - man" still
   doesn't. Photos are not yet consistent.*
4. **Done (2026-11-25).** **Alternate the section backgrounds.** Services on
   white, products on a light tint, the closing call to action on navy, so the
   page does not read as one long block. *Built as blue, lavender and aqua
   aurora bands, with colours editable in the CMS.*

### New sections (driven by the CMS, no made-up content)

5. **Done (2026-11-25).** **Client logo strip under the hero.** Greyscale logos that turn to colour on
   hover, from the Clients collection. Logos need MONIP's approval.
6. **Done (2026-11-25; MONIP chooses the story).** **Success story spotlight.** One large story from Success Stories: an image
   on one side; the challenge, what MONIP did and the result on the other.
7. **Done (2026-11-25).** **"How we work" in 3–4 steps:** Strategy → Design → Sourcing → Delivery.
   Turns the four services into one connected offer. *Built as a loop of 4
   CMS-edited steps (currently Strategy → Design → Sourcing → Merchandising).*
8. **Not started.** **Global reach band.** Reuse the About page's world map with the five
   offices (Miami, Hong Kong, Singapore, Mexico City, Korea).
9. **Not started (needs real numbers).** **Stats row** (years in business, products delivered, partners). Only with
   real numbers from MONIP, edited in the CMS; leave it out until then.
10. **Not started.** **Full-width closing call to action.** A navy band with a short headline, a
    sentence, and buttons to contact or start the chat.

### Typography and polish

11. **Partly done.** **More spacing between sections**, with small gold labels above headings
    (for example "WHAT WE DO" above "Our services"). *Sections are spaced on
    their own bands and headings have a gold accent bar; there are no text
    labels yet.*
12. **Not started.** **Larger section headings**, each with a short description underneath.
13. **Not started.** **A bolder hero headline**: bigger type, one key phrase in gold, and an
    optional rotating line under it ("Cruise lines · Retail · Destinations").

## Part 2: Motion and animation

The site already has page fade transitions, images that morph between pages,
a sliding nav indicator, a header that slims on scroll, the aurora background
and the hero slideshow. What the home page lacks is motion as you scroll down.

### Hero

14. **Not started.** **Staggered entrance.** Headline, intro and buttons rise and fade in about
    100 ms apart; a gold underline then draws under one key phrase. Keep it
    under 600 ms, and don't start the headline fully invisible: it is likely
    the page's main load-speed element.
15. **Not started.** **Scroll parallax.** The background moves slower than the text and the
    overlay deepens as you scroll.
16. **Not started.** **Scroll cue.** A small animated chevron at the bottom of the hero that
    fades out once scrolling starts.

### Sections as they come into view

17. **Not started.** **Reveal on scroll.** Cards fade up in a left-to-right cascade as each row
    enters the screen; heading accent bars grow in.
18. **Done (2026-11-25), in a different form.** **"How we work" timeline.** The connecting line draws itself as you scroll,
    and each step lights up when the line reaches it. *Built as a timed loop
    that starts when the section comes into view: each step's number ticks
    for 2 seconds, then its arrow grows to the next card.*
19. **Not started (needs the global reach band).** **World map.** Office pins pulse softly and arcs draw between the offices.
20. **Done (2026-11-25).** **Client logo marquee.** A slow, endless scroll that pauses on hover and
    on keyboard focus. *The logos are not links, so there is nothing to focus.*
21. **Not started (needs the stats row).** **Count-up stats.** Numbers tick up when they come into view (real figures
    only).

### Hover and small details

22. **Partly done.** **Service cards.** Slow image zoom, a gold border sweeping around the
    card, and a "Learn more →" arrow sliding in. *The "How we work" cards
    zoom their image, lift and get a gold border on hover; no sweep or
    arrow.*
23. **Not started.** **Product cards.** The second gallery image crossfades in on hover.
24. **Not started.** **Buttons.** A gentle light sweep across the gold button; the arrow nudges
    right on hover.

### How to build it

- **Mostly plain CSS, no new library.** Use scroll-driven animations
  (`animation-timeline: view()`), as the header already does, so sections stay
  server-rendered.
- **Older browsers degrade cleanly.** Browsers without scroll-driven animations
  (currently Firefox) show the content as it is now.
- **Respect reduced motion.** No movement for visitors who set their device to
  reduce motion.
- **Animate only cheap properties** (transform, opacity) and reuse the existing
  easing curve and 400–700 ms timing.
- **Keep it subtle.** Each item animates once; only the marquee and map pulse
  loop.

## Recommended next steps

- **Content (in the admin):** the remaining placeholders and photos (2–3).
- **Layout:** closing call to action (10), then the global reach band (8).
- **Motion:** hero entrance (14), reveal on scroll (17), product card hover
  (23). The map arcs (19) are the most striking extra once the global reach
  band exists.

## Needed from MONIP

- Approval to show client logos (the strip is live; confirm approval).
- Real figures for any stats row.
- Consistent product photography and corrected product names.
- Which success story to feature (chosen in the Home page settings).
