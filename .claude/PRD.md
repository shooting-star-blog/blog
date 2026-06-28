# PRD — כוכב נופל (Shooting Star) Blog

**Author:** ש.מ (S.M)  
**Date:** 2026-06-27  
**Status:** Draft

---

## 1. Problem Statement

The author currently publishes Hebrew sci-fi and fantasy short stories on Wix, which carries monthly platform costs, limited SEO control, and a rigid editing experience. The goal is to migrate to a self-owned static site that costs ~$10/year (domain only), publishes automatically on a `git push`, and ranks well on search engines — including in English-speaking markets via bilingual metadata.

---

## 2. Goals & Non-Goals

### Goals
| # | Goal | Metric |
|---|------|--------|
| G1 | Near-zero hosting cost | ≤ $10/year (domain only) |
| G2 | Frictionless publishing | New story live within 60 seconds of `git push` |
| G3 | Discoverable content | sitemap.xml, OG tags, JSON-LD on every story page |
| G4 | Full RTL Hebrew support | `dir="rtl"` `lang="he"` on all pages, no layout breaks |
| G5 | Migrate all 13 Wix stories | 100% story content preserved with cover images |
| G6 | Newsletter signups | Buttondown embed present on homepage and footer |

### Non-Goals
- Custom CMS backend (Decap CMS is an optional stretch; not required for v1)
- Comments / community features
- Story translations (English summaries for SEO only, not full translations)
- E-commerce or paid content

---

## 3. Users & Personas

| Persona | Description | Primary Need |
|---------|-------------|--------------|
| **ש.מ (Author)** | Technical enough for VS Code + Git, not a developer | Write Markdown → push → done |
| **Hebrew reader** | Arrives from Google or word-of-mouth | Fast, readable, mobile-friendly story page in RTL |
| **International reader** | Arrives from Google in English | Finds the story via English metadata; may not read Hebrew |
| **Newsletter subscriber** | Existing or prospective fan | Know when a new story is published |

---

## 4. User Stories

### Author
- **US-1:** As the author, I can create a new story by adding a single `.md` file to `content/stories/` and pushing to Git, so the site updates without any manual deploy step.
- **US-2:** As the author, I can preview the site locally with `hugo server` before publishing.
- **US-3:** As the author, I can set a story to `draft: true` to keep it off the live site while still committing the file.

### Hebrew Reader
- **US-4:** As a Hebrew reader on mobile, I see a readable RTL layout with appropriate font size and line-height for long-form text.
- **US-5:** As a reader, I can browse all stories on a list page, sorted by date.
- **US-6:** As a reader, I can share a story link that resolves to a clean URL (e.g. `/stories/akira/`).
- **US-9:** As a reader, I can click a tag on any story and see all other stories that share that tag.
- **US-10:** As a reader, I finish a story and immediately see 2–3 suggested stories that share at least one tag with the one I just read.
- **US-11:** As a keyboard-only user, I can navigate the entire site without a mouse; all interactive elements are reachable via Tab and activated via Enter/Space.

### International Reader
- **US-7:** As a Google user searching in English, I find a story via its English title and description in search results.

### Newsletter Subscriber
- **US-8:** As a visitor, I can sign up for the newsletter directly on the homepage or footer without leaving the site.

---

## 5. Functional Requirements

### 5.1 Site Infrastructure
| ID | Requirement |
|----|-------------|
| F-01 | Hugo static site generator with `config.toml` setting `languageCode = "he"`, `defaultContentLanguage = "he"`, `dir = "rtl"` |
| F-02 | GitHub Actions workflow: on push to `main`, build Hugo → deploy to `gh-pages` branch |
| F-03 | All Hugo templates use `dir="rtl"` on `<html>` and load Heebo or Assistant from Google Fonts |
| F-04 | `robots.txt` generated, allowing all crawlers |
| F-05 | Auto-generated `sitemap.xml` at site root |
| F-06 | RSS feed at `/index.xml` |

### 5.2 Pages & Templates

| ID | Page | Template | Requirements |
|----|------|----------|--------------|
| F-07 | Homepage | `layouts/index.html` | Hero section with site tagline, featured stories grid (stories where `featured: true`), newsletter embed |
| F-08 | Stories list | `layouts/_default/list.html` | Paginated list of all stories, sorted by date desc, each card shows cover image + title + description + tags |
| F-09 | Single story | `layouts/_default/single.html` | Full story text, cover image, clickable tag chips, JSON-LD `Article` schema, suggested stories section, copyright notice |
| F-10 | About/Contact | Standard content page | Author bio, contact email (`shootingstarblog@outlook.com`), copyright notice |
| F-11a | Tag taxonomy page | `layouts/taxonomy/tag.html` | Lists all stories that share a given tag; URL pattern `/tags/<tag-slug>/` |

### 5.3 SEO & Metadata (per story page)
| ID | Requirement |
|----|-------------|
| F-11 | `<title>` = story Hebrew title |
| F-12 | `<meta name="description">` = `description` frontmatter field |
| F-13 | OG tags: `og:title` (Hebrew), `og:description`, `og:image` (cover), `og:type = "article"` |
| F-14 | JSON-LD `Article` object: `headline`, `image`, `datePublished`, `author` |
| F-15 | `<link rel="alternate" hreflang="he">` on all pages |
| F-16 | English meta description populated from `description_en` frontmatter when present |

### 5.4 Content — Story Frontmatter
Every story file must include:
```yaml
---
title: ""           # Hebrew title (required)
title_en: ""        # English title (optional, SEO)
date: YYYY-MM-DD    # Publication date (required)
description: ""     # Hebrew short summary (required)
description_en: ""  # English short summary (optional, SEO)
cover: "/images/filename.jpg"
tags: []
featured: false
draft: false
---
```

### 5.5 Tags & Discovery

| ID | Requirement |
|----|-------------|
| F-22 | Hugo taxonomy `tags` enabled in `config.toml`; each tag generates a page at `/tags/<slug>/` |
| F-23 | Tag chips rendered on every story card (list page) and on the single story page; each chip links to its taxonomy page |
| F-24 | Tag taxonomy page (`layouts/taxonomy/tag.html`) shows all stories sharing that tag, same card layout as the stories list |
| F-25 | Single story page includes a "סיפורים נוספים" (More Stories) section at the bottom: up to 3 stories that share at least one tag with the current story, excluding the current story itself |
| F-26 | If no tag-related stories exist, the suggested stories section is omitted entirely (no empty block) |

### 5.6 Featured Stories (Homepage)

| ID | Requirement |
|----|-------------|
| F-27 | Homepage grid renders only stories where `featured: true` in frontmatter |
| F-28 | The author can change the featured set at any time by editing frontmatter and pushing; no code change needed |
| F-29 | If zero stories are marked `featured`, the homepage falls back to the 6 most recent stories |
| F-30 | Maximum 6 stories shown in the featured grid; if more than 6 are marked `featured`, show the 6 most recent by date |

### 5.7 Newsletter
| ID | Requirement |
|----|-------------|
| F-17 | Buttondown embed rendered via `layouts/partials/newsletter.html` |
| F-18 | Embed appears in homepage hero/footer area and in the global site footer |
| F-19 | CTA copy: "הירשמו ותדעו מתי מתפרסם הסיפור הבא" |

### 5.8 Copyright
| ID | Requirement |
|----|-------------|
| F-20 | Full Hebrew copyright notice appears in `layouts/partials/footer.html` on every page |
| F-21 | Notice text: "© כל הזכויות שמורות לש.מ — אין להעתיק, לשכפל…" (full text per CLAUDE.md) |

---

## 6. Content Migration

All 13 stories must be migrated from Wix to Markdown files in `content/stories/`:

| Hebrew Title | Slug |
|---|---|
| ימים של אהבה | `days-of-love.md` |
| הבצורת | `the-drought.md` |
| האבן השחורה | `the-black-stone.md` |
| אטמוספירה כפולה | `double-atmosphere.md` |
| מחר נהיה שוב עשירים | `tomorrow-rich-again.md` |
| גוף ראשון נחמד | `nice-first-person.md` |
| היהלום | `the-diamond.md` |
| הכפילה | `the-double.md` |
| על התפירה | `on-the-seam.md` |
| וידאוהום | `videohome.md` |
| בלון גז | `gas-balloon.md` |
| הקופסה | `the-box.md` |
| אקירה | `akira.md` |

Cover images must be sourced from **Pixabay** (royalty-free). Download originals and commit to `assets/images/` (not `static/`) so Hugo's image processing pipeline can generate optimized WebP versions at build time. Filenames must match the `cover` frontmatter field.

---

## 7. Design Requirements

| ID | Requirement |
|----|-------------|
| D-01 | Dark/space aesthetic: dark background (`#0d0d0d` or similar), light text |
| D-02 | Mobile-first layout; story text column max-width ~680px, centered |
| D-03 | **UI font:** [Heebo](https://fonts.google.com/specimen/Heebo) — modern, geometric, clean; used for navigation, headings, cards, and UI chrome |
| D-04 | **Body/story font:** [Frank Ruhl Libre](https://fonts.google.com/specimen/Frank+Ruhl+Libre) — serif, resembles classic Hebrew printed-book typography; used exclusively for story body text; minimum 19px / 1.8 line-height |
| D-05 | Both fonts loaded from Google Fonts with `font-display: swap`; preconnect hints in `<head>` |
| D-06 | RTL-safe CSS: `direction: rtl; text-align: right` on body; no hardcoded `left`/`right` floats |
| D-07 | Cover images displayed as full-width hero on single story pages |
| D-08 | Minimal navigation: site name/logo → homepage, "סיפורים" → list, "אודות" → about |
| D-09 | Tag chips: small pill-shaped labels; use a muted accent color (e.g. deep purple or dark teal) that meets 3:1 contrast on the dark background |

---

## 8. Technical Constraints

- Hugo version ≥ 0.120 (for `hugo.toml` / `config.toml` compatibility)
- GitHub Pages free tier; no server-side code
- No JavaScript frameworks — vanilla JS only if needed
- Google Fonts loaded via `<link>` in `<head>`, with `font-display: swap`

### 8.1 Images

| ID | Requirement |
|----|-------------|
| I-01 | Cover images sourced from **[Pixabay](https://pixabay.com)** (royalty-free, no attribution required under Pixabay License) |
| I-02 | Hugo image processing pipeline used for all cover images: resize to max 1200px wide, convert to WebP via `resources.Get` + `.Process "webp"` |
| I-03 | Responsive `srcset` generated for three breakpoints: 400px (mobile), 800px (tablet), 1200px (desktop) |
| I-04 | Hero image on single story page uses `loading="eager"` and `fetchpriority="high"` (it is the LCP element) |
| I-05 | All other images (story cards, suggested stories) use `loading="lazy"` |
| I-06 | Final WebP file size target: ≤ 120 KB for card thumbnails, ≤ 250 KB for hero images |
| I-07 | Every `<img>` element must have a descriptive `alt` attribute populated from the story title (e.g. `alt="עטיפת הסיפור: אקירה"`) |

---

## 9. Accessibility

**Target standard: WCAG 2.1 Level AA (100% compliance)**

### 9.1 Structure & Semantics
| ID | Requirement |
|----|-------------|
| A-01 | Semantic HTML5 landmarks on every page: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` |
| A-02 | A visible "דלג לתוכן" (skip-to-main-content) link as the first focusable element on every page |
| A-03 | Heading hierarchy is strictly sequential: one `<h1>` per page, no skipped levels |
| A-04 | All `<a>` and `<button>` elements have descriptive text or an `aria-label`; no "לחץ כאן" (click here) link text |
| A-05 | Tag chip links carry `aria-label="סיפורים בנושא: <tag name>"` |

### 9.2 Color & Contrast
| ID | Requirement |
|----|-------------|
| A-06 | Body text on dark background: minimum contrast ratio **7:1** (WCAG AAA) — large Hebrew body text warrants the higher bar |
| A-07 | UI elements (nav links, tag chips, card titles): minimum contrast ratio **4.5:1** |
| A-08 | Interactive element focus outline: minimum contrast ratio **3:1** against surrounding background; never `outline: none` without a visible replacement |

### 9.3 Keyboard & Motor
| ID | Requirement |
|----|-------------|
| A-09 | All interactive elements (nav, story cards, tag chips, newsletter form, footer links) reachable by Tab in logical order |
| A-10 | Focus indicator always visible; default browser outline may be enhanced but never removed |
| A-11 | No keyboard traps; modal or overlay elements (if any) must be closable with Escape |

### 9.4 Images & Media
| ID | Requirement |
|----|-------------|
| A-12 | Every cover image has a meaningful `alt` (see I-07); purely decorative images use `alt=""` |
| A-13 | No content conveyed by color alone (tag chips labeled by text, not color only) |

### 9.5 Forms
| ID | Requirement |
|----|-------------|
| A-14 | Buttondown newsletter `<input>` has an associated `<label>` (visible or `aria-label`) |
| A-15 | Form error states announced to screen readers via `aria-live="polite"` or `role="alert"` |

### 9.6 Motion & Animation
| ID | Requirement |
|----|-------------|
| A-16 | Any CSS transitions respect `@media (prefers-reduced-motion: reduce)`; all animations disabled or reduced when user preference is set |

### 9.7 Testing
| ID | Requirement |
|----|-------------|
| A-17 | Automated scan with **axe-core** (via `axe` CLI or browser extension) — zero violations before launch |
| A-18 | Manual keyboard-only walkthrough of the full user flow: homepage → story list → single story → tag page → newsletter form |

---

## 10. Analytics

- **Google Search Console** — verify domain ownership, monitor indexing (free, no cookies required)
- **Umami Cloud** (optional) — privacy-friendly pageview analytics; embed script in `head.html` if account is created

---

## 11. Build Order (Prioritized)

| Priority | Task | Deliverable |
|----------|------|-------------|
| P0 | Hugo config | `config.toml` with RTL, lang=he, baseURL, `tags` taxonomy enabled |
| P0 | Base template + CSS | `baseof.html`, `main.css` — RTL, dark theme, Heebo (UI) + Frank Ruhl Libre (body), skip link, focus styles |
| P0 | Homepage | `layouts/index.html` — featured stories grid (`featured: true`), fallback to 6 most recent |
| P0 | Story list | `layouts/_default/list.html` — story cards with tag chips |
| P0 | Single story | `layouts/_default/single.html` — story text, tag chips, JSON-LD, suggested stories section |
| P0 | Tag taxonomy page | `layouts/taxonomy/tag.html` — all stories per tag |
| P0 | SEO head partial | `layouts/partials/head.html` — OG, JSON-LD, hreflang |
| P0 | CI/CD | `.github/workflows/deploy.yml` |
| P0 | Accessibility baseline | skip link, semantic landmarks, focus indicators, axe-core pass |
| P1 | Story migration | All 13 `.md` files + Pixabay cover images (optimized WebP via Hugo pipeline) |
| P1 | Newsletter embed | `layouts/partials/newsletter.html` + Buttondown account + accessible form labels |
| P1 | About/Contact page | `content/about.md` + layout |
| P2 | Analytics | Google Search Console verification tag in `head.html` |
| P2 | Decap CMS | `static/admin/` config (optional, if Git CLI is too technical) |

---

## 12. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time-to-publish | ≤ 60 seconds after `git push` | GitHub Actions run time |
| Lighthouse SEO score | ≥ 95 | `lighthouse <url> --only-categories=seo` |
| Lighthouse Performance | ≥ 90 mobile | `lighthouse <url>` |
| Lighthouse Accessibility | **100** | `lighthouse <url> --only-categories=accessibility` |
| axe-core violations | **0** | `axe <url>` CLI scan |
| All 13 stories indexed | 100% | Google Search Console Coverage report |
| Annual hosting cost | ≤ $10 | Domain registrar invoice |
| RTL layout pass | No visual LTR artifacts | Manual review on mobile + desktop |
| Cover image LCP | ≤ 2.5 seconds (Good) | Lighthouse LCP metric on story page |

---

## 13. Privacy & Legal Compliance

### 13.1 Legal Obligations

| Law | Applicability | Trigger |
|-----|--------------|---------|
| Israeli Protection of Privacy Law (5741-1981) | Mandatory | Author is Israeli; primary audience is Israeli; email addresses collected via newsletter |
| GDPR (EU Regulation 2016/679) | Best-effort compliance | Any EU resident who reads the site or subscribes |

### 13.2 Privacy Policy Page

| ID | Requirement |
|----|-------------|
| PL-01 | A Privacy Policy page must exist at `/privacy/` |
| PL-02 | Policy must disclose: what personal data is collected (email address via newsletter), who processes it (Buttondown), how it is used (newsletter only), and the subscriber's right to unsubscribe and request deletion |
| PL-03 | Policy must disclose analytics: page-view data collected via Umami; no personally identifiable information stored; no cookies set |
| PL-04 | Policy must include the contact email: shootingstarblog@outlook.com |
| PL-05 | Privacy Policy link must appear in the site footer on every page |

### 13.3 Newsletter Consent

| ID | Requirement |
|----|-------------|
| PL-06 | Newsletter signup form must display a consent note immediately below the submit button: "לא נשלח ספאם. ביטול הרשמה בכל עת." |
| PL-07 | The consent note must include a link to the Privacy Policy page (`/privacy/`) |
| PL-08 | No pre-checked consent checkboxes; submitting the form constitutes explicit opt-in |

### 13.4 Analytics

| ID | Requirement |
|----|-------------|
| PL-09 | Use **Umami Cloud** (cookie-free, privacy-first) — not Google Analytics. Umami collects no PII and sets no cookies, eliminating the need for a cookie consent banner |
| PL-10 | If Google Analytics is ever adopted in the future, a GDPR-compliant cookie consent banner must be added before any GA script loads |
| PL-11 | The Umami site ID is configured via `params.umamiSiteId` in `config.toml`; the script is injected in `head.html` only when this param is non-empty, so local development runs without analytics |

---

## 14. Out of Scope (v1)

- Story comments or reader accounts
- Full English translation of stories
- Social login
- Search functionality (can be added in v2 with Fuse.js or Pagefind)
- Paid newsletter tiers
- Custom illustration work (Pixabay royalty-free images used instead)
