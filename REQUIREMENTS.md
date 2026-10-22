# MONIP Group Website Rebuild --- Requirements

**Document:** `REQUIREMENTS.md`\
**Project:** MONIP Group website modernization\
**Status:** Initial baseline --- validate business-specific details
during discovery\
**Target stack:** Next.js, TypeScript, Sanity CMS, Vercel

## 1. Project Overview

Rebuild the MONIP Group website as a modern, responsive, multi-page
business website with a custom frontend and a headless CMS. The website
should clearly communicate MONIP's capabilities, showcase product
samples, and make it easy for prospective customers to contact the
company.

The CMS must let authorized MONIP staff create, edit, organize, preview,
publish, and archive product samples without needing to modify code.

The rebuild should preserve useful existing content and search
visibility where practical while improving design, navigation,
accessibility, performance, and lead generation.

## 2. Goals

1.  Present MONIP as a credible, professional merchandising and
    product-sourcing partner.
2.  Make products easy to browse through categories, search, filters,
    and dedicated detail pages.
3.  Enable nontechnical staff to manage product samples and site content
    through Sanity Studio.
4.  Generate useful business inquiries, including inquiries tied to
    specific products.
5.  Provide a maintainable architecture that can support future
    enhancements without a major rewrite.
6.  Preserve relevant existing URLs and SEO value where possible.
7.  Deliver a high-quality experience on mobile, tablet, and desktop.

## 3. Scope

### 3.1 In scope for initial release

-   Custom Next.js and TypeScript frontend.
-   Sanity CMS and Sanity Studio configuration.
-   Multi-page corporate website.
-   CMS-managed product catalog and product detail pages.
-   Product categories, tags, search, and practical filters.
-   Homepage featuring selected products and key company content.
-   About, Services, Sustainability, Clients/Case Studies, and Contact
    content areas, subject to content availability.
-   Product-specific inquiry form and general contact form.
-   Form validation, spam protection, and secure handling of
    submissions.
-   SEO metadata, sitemap, robots configuration, canonical URLs, and
    redirects where required.
-   Responsive design and accessibility practices.
-   Analytics integration, subject to MONIP approval and applicable
    consent requirements.
-   Content migration of approved existing material.
-   Deployment to Vercel, with preview and production environments.
-   CMS editor guidance and launch handover documentation.
-   Testing, launch checklist, and basic monitoring.

### 3.2 Not in scope unless separately approved

-   E-commerce checkout, online payments, inventory, or order
    fulfillment.
-   Customer accounts, client-only product catalogs, or authentication.
-   Supplier-facing portals.
-   Automated quoting, pricing calculators, or quote approval workflows.
-   CRM integration beyond an agreed basic form delivery method.
-   Translation and multilingual content.
-   Custom ERP, PIM, or inventory integrations.
-   Paid advertising management or ongoing content production.
-   Advanced personalization or AI-powered recommendations.

These may be added later after requirements and budget are confirmed.

## 4. Proposed Site Map

1.  **Home** --- positioning, services overview, featured products,
    differentiators, sustainability highlights, client proof where
    approved, and calls to action.
2.  **About** --- company story, capabilities, values, and approved team
    or company information.
3.  **Services** --- overview and, where useful, individual service
    detail sections/pages.
4.  **Products** --- searchable and filterable product catalog.
5.  **Product Detail** --- unique page for each published product.
6.  **Sustainability** --- substantiated sustainability practices,
    materials, programs, and certifications.
7.  **Clients / Case Studies** --- approved client logos, projects, and
    case studies where available.
8.  **Contact** --- general inquiry form and approved contact
    information.
9.  **Privacy Policy** --- content supplied or approved by MONIP.
10. **404 page** --- helpful recovery links and navigation.

The final sitemap may be simplified if there is insufficient approved
content for a dedicated page. Do not publish empty pages or invent
company claims.

## 5. Audiences and Primary Journeys

### Audiences

-   Prospective business customers.
-   Existing customers exploring product samples or services.
-   Partners and other business contacts.
-   MONIP staff responsible for website content.

### Key journeys

1.  A visitor understands MONIP's value proposition from the homepage.
2.  A visitor browses or searches the product catalog.
3.  A visitor opens a product detail page and submits an inquiry
    referencing that product.
4.  A visitor learns about MONIP's services and submits a general
    inquiry.
5.  An authorized editor adds a product, uploads images, previews it,
    and publishes it without developer help.
6.  A site administrator updates company content and metadata without
    changing application code.

## 6. Functional Requirements

### 6.1 Navigation and pages

-   Provide consistent desktop and mobile navigation.
-   Include a clear primary call to action such as **Discuss a
    Project**.
-   Ensure all pages have clear headings, useful internal links, and a
    consistent footer.
-   Use reusable design components and page templates.
-   Ensure the site works with keyboard navigation and touch input.

### 6.2 Product catalog

Each product should support the following fields, as appropriate:

-   Product name.
-   URL slug.
-   Short summary.
-   Full description.
-   Primary image and additional gallery images.
-   Category and optional subcategory.
-   Tags.
-   Materials.
-   Customization options.
-   Industry, market, or application.
-   Featured status.
-   Optional labels such as New or Sustainable, only when accurate.
-   Optional public specifications, such as dimensions or other relevant
    details.
-   SEO title and description.
-   Publication status and timestamps.

Commercially sensitive data, such as supplier identity, internal costs,
private notes, and unpublished pricing, must not be stored in the CMS at
all. Minimum order quantity, lead time, and pricing should be optional
and public only when explicitly approved.

Catalog behavior:

-   Only published products appear publicly.
-   Product cards link to stable, unique detail pages.
-   Visitors can browse categories and use relevant search/filter
    controls.
-   Empty search and filter states provide helpful messaging.
-   Related products may be displayed when the relationship is
    configured.
-   Archived or unpublished products are not included in public
    listings, search results, or sitemap. "Archive" means unpublish;
    an unpublished product URL returns 404.
-   If an existing product URL changes, use an appropriate redirect when
    feasible.
-   Product inquiries include a reliable reference to the product, such
    as its name and URL.

### 6.3 CMS and editorial workflow

-   Provide a Sanity Studio workspace for authorized users.
-   Use clearly labeled fields and sensible field groups.
-   Support product creation, editing, previewing, publishing,
    unpublishing, and archiving.
-   Support image upload, alternative text, captions where useful, and
    image ordering.
-   Provide reusable schemas for products, categories, services, case
    studies, and site settings.
-   Support draft previews that are not publicly accessible.
-   Configure access using the least privilege practical for the
    selected Sanity plan.
-   Provide validation for required fields and URL slugs.
-   Document how to add a product and update core pages.
-   Keep CMS secrets and privileged tokens out of browser-delivered
    code.

### 6.4 Forms and lead generation

-   Provide a general contact form.
-   Provide a product-specific inquiry form.
-   Collect only necessary contact and inquiry information.
-   Validate inputs on both client and server.
-   Include spam mitigation, such as a honeypot and/or a suitable
    CAPTCHA service if needed.
-   Provide clear success and error states.
-   Deliver submissions to a MONIP-approved destination, such as a
    configured email service or CRM.
-   Do not claim a submission succeeded until the server confirms
    acceptance.
-   Avoid exposing recipient addresses, API keys, or service credentials
    in client-side code.
-   Include appropriate privacy notice text approved by MONIP.
-   Log operational errors without unnecessarily storing sensitive form
    content.

Confirmed delivery (may change later):

-   Each submission is saved as an Inquiry document in Sanity
    (server-side write only; never publicly readable).
-   MONIP receives a notification email per submission (recipient
    address is a placeholder until confirmed).
-   The submitter receives a fixed-text auto-reply that never echoes
    their message.
-   Rate limiting is deferred but is a launch blocker.

### 6.5 SEO and migration

-   Give each indexable page a unique title and meta description.
-   Use semantic headings and descriptive internal links.
-   Generate XML sitemap and robots.txt.
-   Set canonical URLs where appropriate.
-   Add social sharing metadata.
-   Use structured data only when accurate and appropriate.
-   Optimize image dimensions, formats, and alt text.
-   Inventory existing URLs before launch.
-   Preserve URLs where practical and create redirects for changed URLs.
-   Migrate only approved, accurate content.
-   Review existing claims, statistics, client names, logos, and
    sustainability statements before republishing.
-   Do not invent testimonials, client endorsements, metrics,
    certifications, or product specifications.

### 6.6 Analytics

-   Add an analytics provider only after MONIP approves it.
-   Track meaningful events where supported, such as product views,
    catalog searches, inquiry starts, and successful inquiry
    submissions.
-   Respect applicable privacy and consent requirements.
-   Avoid collecting unnecessary personal information in analytics.

## 7. Nonfunctional Requirements

### Performance

-   Optimize images and use responsive image delivery.
-   Prefer server rendering or static generation where appropriate.
-   Avoid unnecessary client-side JavaScript.
-   Set performance budgets and measure representative pages before
    launch.

### Accessibility

-   Aim for WCAG 2.2 AA practices.
-   Use semantic HTML, keyboard-accessible controls, visible focus
    states, sufficient contrast, and accessible form errors.
-   Provide useful alt text for meaningful images; use empty alt text
    for decorative imagery.

### Security

-   Keep secrets in environment variables and hosting secret storage.
-   Validate and sanitize form inputs.
-   Restrict draft previews and privileged CMS operations.
-   Use least-privilege credentials.
-   Avoid rendering unsafe HTML from CMS content.
-   Apply appropriate security headers and rate limiting where
    practical.
-   Never commit production secrets to source control.

### Reliability and maintainability

-   Use TypeScript and consistent linting/formatting.
-   Keep CMS schemas and frontend types aligned.
-   Provide environment setup and deployment instructions.
-   Include useful error handling and logging.
-   Use version control and preview deployments.
-   Keep dependencies current through a deliberate maintenance process.

### Responsive behavior

-   Support common mobile, tablet, laptop, and desktop widths.
-   Test navigation, catalog filters, forms, and galleries on touch
    devices.

## 8. Content and Brand Rules

-   Use MONIP-approved brand assets, logos, colors, copy, photography,
    and contact information.
-   Establish design tokens for typography, spacing, colors, radii, and
    buttons.
-   Prefer authentic product and company imagery over generic stock
    imagery when approved assets are available.
-   Do not alter product imagery in ways that misrepresent the actual
    sample.
-   Use consistent product image ratios and compression.
-   Keep copy clear, professional, and business-oriented.
-   Do not publish unsupported environmental or sustainability claims.

## 9. Acceptance Criteria

The initial release is ready for launch when:

1.  All approved in-scope pages are implemented and responsive.
2.  A CMS editor can create, preview, publish, update, and archive a
    product without editing code.
3.  Published products automatically appear in the catalog and have
    working detail pages.
4.  Draft and archived products do not appear in public listings or the
    sitemap.
5.  Search and filters work for the agreed product fields.
6.  Product inquiries identify the correct product and are delivered to
    the approved destination.
7.  General contact submissions are validated, protected against basic
    spam, and delivered correctly.
8.  No production secrets are exposed in the frontend or committed to
    the repository.
9.  Metadata, sitemap, redirects, and canonical behavior are checked.
10. Approved content and assets have been migrated and reviewed.
11. Core user journeys pass manual and automated tests.
12. Accessibility, performance, responsive behavior, and cross-browser
    checks have been completed.
13. The site is deployed to the approved production domain with HTTPS.
14. MONIP receives CMS usage instructions and launch handover notes.

## 10. Decisions to Confirm During Discovery

Record final decisions in the project documentation before implementing
dependent features. Confirmed decisions are tracked in the `PLAN.md`
decision log.

-   Final brand direction, logo files, typography, and imagery.
-   Exact product categories and filters.
-   Whether all products are public at launch.
-   Whether a product-specific inquiry or a quote request is preferred.
-   Inquiry delivery destination and email/CRM provider.
-   Approved contact details and legal/privacy copy.
-   Analytics and consent requirements (MONIP operates in the US).
-   Final list of pages and approved content.
-   Existing URL inventory and redirect requirements.
-   CMS user roles and who approves publication.
-   Domain, hosting account ownership, and deployment access (TBD).
-   Current website URL for the URL inventory (placeholder until
    provided).
-   Budget, timeline, and any external integrations.

## 11. Assumptions for Initial Planning

Unless MONIP specifies otherwise, plan on:

-   A public product catalog at launch.
-   Nontechnical staff managing content in Sanity Studio.
-   Product-specific inquiry forms plus a general contact form.
-   No e-commerce checkout or customer login in the initial release.
-   Migration of useful existing content after review.
-   Next.js + TypeScript, Sanity, and Vercel.
-   A multi-page website with reusable templates.
