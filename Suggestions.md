# Home Page Suggestions

Ideas to make the home page (https://monip-group.vercel.app/) more attractive,
modern and engaging. Nothing here is implemented yet.

**Current state:** a navy hero with a background video or slideshow, a
headline, an intro and an "About" text link, then four service cards, four
featured products and a single "Discuss a project" button. It is clean but
short: nothing between the hero and the footer tells the story or builds
trust.

## Part 1: Layout and content

### Quick wins

1. **Give the hero real buttons.** The only action in the hero is a text link
   to About. Add a gold primary button ("Explore products") and an outlined
   secondary button ("Discuss a project").
2. **Fix the visible placeholders** (in the admin):
   - Service links point to `#placeholder-service-1/2/3` and the cut-off
     `#progra`.
   - Product URLs include `test-1` and `placeholder-product-1-copy`.
   - Alt texts such as "[Design]" and "[sun glasses -man]".
3. **Make product names and photos consistent.** "Sun glasses - man" sits next
   to "Touch of Luxury Rings". Use one naming style, and shoot products on the
   same background in the same light.
4. **Alternate the section backgrounds** (built 2026-11-25: aurora bands in alternating shades of blue)**.** Services on white, products on a
   light tint, the closing call to action on navy, so the page does not read
   as one long block.

### New sections (driven by the CMS, no made-up content)

5. **Client logo strip under the hero.** Greyscale logos that turn to colour on
   hover, from the Clients collection. Logos need MONIP's approval.
6. **Success story spotlight** (built 2026-11-25; MONIP chooses the story)**.** One large story from Success Stories: an image
   on one side; the challenge, what MONIP did and the result on the other.
7. **"How we work" in 3–4 steps:** Strategy → Design → Sourcing → Delivery.
   Turns the four services into one connected offer.
8. **Global reach band.** Reuse the About page's world map with the five
   offices (Miami, Hong Kong, Singapore, Mexico City, Korea).
9. **Stats row** (years in business, products delivered, partners). Only with
   real numbers from MONIP, edited in the CMS; leave it out until then.
10. **Full-width closing call to action.** A navy band with a short headline, a
    sentence, and buttons to contact or start the chat.

### Typography and polish

11. **More spacing between sections**, with small gold labels above headings
    (for example "WHAT WE DO" above "Our services").
12. **Larger section headings**, each with a short description underneath.
13. **A bolder hero headline**: bigger type, one key phrase in gold, and an
    optional rotating line under it ("Cruise lines · Retail · Destinations").

## Part 2: Motion and animation

The site already has page fade transitions, images that morph between pages,
a sliding nav indicator, a header that slims on scroll, the aurora background
and the hero slideshow. What the home page lacks is motion as you scroll down.

### Hero

14. **Staggered entrance.** Headline, intro and buttons rise and fade in about
    100 ms apart; a gold underline then draws under one key phrase. Keep it
    under 600 ms, and don't start the headline fully invisible: it is likely
    the page's main load-speed element.
15. **Scroll parallax.** The background moves slower than the text and the
    overlay deepens as you scroll.
16. **Scroll cue.** A small animated chevron at the bottom of the hero that
    fades out once scrolling starts.

### Sections as they come into view

17. **Reveal on scroll.** Cards fade up in a left-to-right cascade as each row
    enters the screen; heading accent bars grow in.
18. **"How we work" timeline.** The connecting line draws itself as you scroll,
    and each step lights up when the line reaches it.
19. **World map.** Office pins pulse softly and arcs draw between the offices.
20. **Client logo marquee.** A slow, endless scroll that pauses on hover and
    on keyboard focus.
21. **Count-up stats.** Numbers tick up when they come into view (real figures
    only).

### Hover and small details

22. **Service cards.** Slow image zoom, a gold border sweeping around the
    card, and a "Learn more →" arrow sliding in.
23. **Product cards.** The second gallery image crossfades in on hover.
24. **Buttons.** A gentle light sweep across the gold button; the arrow nudges
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

## Recommended starting points

- **Layout:** hero buttons (1), placeholders and photos (2–3), success story
  spotlight and client logos (5–6).
- **Motion:** hero entrance (14), reveal on scroll (17), card hovers (22–23).
  The map arcs (19) are the most striking extra once the global reach band
  exists.

## Needed from MONIP

- Approval to show client logos.
- Real figures for any stats row.
- Consistent product photography and corrected product names.
- Which success story to feature.
