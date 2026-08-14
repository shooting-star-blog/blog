# Shooting Star Blog — Project Brief

## What This Is
A Hebrew sci-fi & fantasy short story blog called **כוכב נופל (Shooting Star)**, migrated from Wix to a custom static site.
Author: ש.מ (S.M)
Original Wix site: https://shalev76.wixsite.com/shooting-star

## Goals
1. **Cheap** — target ~$10/year total cost (domain only)
2. **Dead simple publishing** — author writes Markdown, pushes to Git, site updates automatically
3. **SEO-friendly** — static HTML, clean URLs, sitemap, meta tags, structured data

## Stack Decisions
| Layer | Choice | Reason |
|---|---|---|
| Static site generator | **Hugo** | Fast, great RTL/Hebrew support, built-in SEO scaffolding |
| Hosting | **GitHub Pages** | Free, deploys on push via GitHub Actions |
| Domain | **Namecheap or Cloudflare Registrar** | ~$10/year (DNS delegated to Cloudflare) |
| Contact | **Cloudflare Worker + Email Routing + Turnstile** (all free tier) | "Leave a message" form on the About page; masks the real inbox address, no third-party form service needed |
| Analytics | **Umami** (cloud free tier) or Google Search Console | Privacy-friendly, no cookie banners |
| Content editing | **VS Code or Obsidian** + Git push | No custom admin needed |
| Optional CMS UI | **Decap CMS** (formerly Netlify CMS) | Browser-based editor that commits to GitHub — use if Git CLI feels too technical |

## Content & Language
- All stories are written in **Hebrew (RTL)**
- Site UI should be RTL by default (`dir="rtl"`, `lang="he"`)
- Each story should have an optional **English subtitle/summary** in the frontmatter for international SEO reach
- Copyright notice must appear on all pages (author retains all rights)

## Repository Structure
```
shooting-star/
├── CLAUDE.md                  # This file
├── config.toml                # Hugo config (site title, baseURL, language, params)
├── content/
│   └── stories/
│       ├── _index.md          # Stories list page
│       ├── akira.md           # One file per story
│       ├── the-diamond.md
│       └── ...
├── layouts/
│   ├── _default/
│   │   ├── baseof.html        # Base template
│   │   ├── list.html          # Stories index page
│   │   └── single.html        # Individual story page
│   ├── index.html             # Homepage
│   └── partials/
│       ├── head.html          # Meta tags, OG, structured data
│       ├── header.html
│       ├── footer.html
│       └── contact.html       # "Leave a message" form; posts to Cloudflare Worker, real inbox masked via Cloudflare Email Routing
├── static/
│   └── images/                # Story cover images
├── assets/
│   └── css/
│       └── main.css           # RTL-aware styles
├── workers/
│   └── contact/                # Cloudflare Worker: receives the contact form, sends via Email Routing (deployed separately with wrangler, not part of the Hugo build)
└── .github/
    └── workflows/
        └── deploy.yml         # GitHub Actions: build Hugo → deploy to gh-pages
```

## Story Frontmatter Template
Each story is a Markdown file with this header:
```yaml
---
title: "אקירה"
title_en: "Akira"           # English title for SEO
date: 2024-01-15
description: "תיאור קצר של הסיפור בעברית"
description_en: "Short English summary for international SEO"
cover: "/images/akira.jpg"
tags: ["מדע בדיוני", "עתיד"]
featured: false
draft: false
---
```

## SEO Requirements
- Clean URLs: `/stories/akira/` (no `.html`)
- Auto-generated `sitemap.xml`
- RSS feed at `/index.xml`
- Per-story Open Graph tags (title, description, cover image)
- JSON-LD structured data (`Article` type) on every story page
- Meta `lang="he"` on Hebrew pages
- robots.txt allowing all crawlers

## Stories to Migrate from Wix
These stories exist on the current Wix site and need to be migrated:
- ימים של אהבה (Days of Love)
- הבצורת (The Drought)
- האבן השחורה (The Black Stone)
- אטמוספירה כפולה (Double Atmosphere)
- מחר נהיה שוב עשירים (Tomorrow We'll Be Rich Again)
- גוף ראשון נחמד (Nice First Person)
- היהלום (The Diamond)
- הכפילה (The Double)
- על התפירה (On the Seam)
- וידאוהום (Videohome)
- בלון גז (Gas Balloon)
- הקופסה (The Box)
- אקירה (Akira)

## Design Direction
- Dark/space aesthetic fits the sci-fi theme (dark background, light text)
- Minimal and literary — the stories are the focus, not the chrome
- Cover images per story (already exist on Wix, need to be downloaded and added to `/static/images/`)
- Mobile-first, readable typography for long-form Hebrew text
- Font suggestion: Heebo or Assistant (Google Fonts, excellent Hebrew support)

## Publishing Workflow (How to Add a New Story)
1. Create a new `.md` file in `/content/stories/`
2. Add frontmatter (copy from template above)
3. Write the story in Markdown below the `---`
4. `git add . && git commit -m "new story: [title]" && git push`
5. GitHub Actions builds and deploys automatically (~60 seconds)

## Contact / Leave a Message
- The newsletter idea (Buttondown, ruled out for lacking RTL support) was dropped entirely in favor of a simple "leave a message" form on the About page — not a comment section, just a lightweight way for readers to reach out.
- Frontend: `layouts/partials/contact.html` — name/email (both optional) + required message, a honeypot field, and a Cloudflare Turnstile widget, submitted via `fetch()` to a Cloudflare Worker. Rendered from `layouts/_default/about.html`.
- Backend: `workers/contact/` — a small Cloudflare Worker (deployed separately with `wrangler deploy`, see its README) that verifies the Turnstile token and sends the message by email through **Cloudflare Email Routing**, all on free tiers.
- **Masking**: the real inbox (`shootingstarblog@outlook.com`) is never shipped to the browser or checked into public config. The public-facing identity is the masked alias `contact@shooting-star-blog.com` (a Cloudflare Email Routing address forwarding to the real inbox), used in `config.toml`'s `contactEmail` param and on the privacy page.
- Config: `config.toml`'s `contactFormEndpoint` (the deployed Worker's URL) and `turnstileSiteKey` (public Turnstile site key) — both empty by default; the contact section renders only once they're set.
- The real address is configured once, directly in the Cloudflare dashboard (Email Routing destination) and as a `wrangler secret put TO_ADDRESS` on the Worker — never in `wrangler.toml` or anywhere else committed to this (public) repo.

## Copyright Notice
Must appear in footer on all pages (Hebrew):
> © כל הזכויות שמורות לש.מ
> אין להעתיק, לשכפל, לצלם, לתרגם, להקליט, לשדר, לקלוט ו/או לאכסן במאגר מידע בכל דרך ו/או אמצעי מכני, דיגיטלי, אופטי, מגנטי ו/או אחר – חלק כלשהו מן המידע ו/או הסיפורים ו/או התמונות ו/או האיורים ו/או כל תוכן אחר שצורף ו/או נכלל באתר אינטרנט זה.

## What to Build First (Suggested Order)
1. `config.toml` — site config with RTL, Hebrew language, base URL
2. Base HTML templates with RTL layout and Hebrew fonts
3. Homepage (`layouts/index.html`) — hero quote, featured stories grid
4. Story list page (`layouts/_default/list.html`)
5. Single story page (`layouts/_default/single.html`) with JSON-LD
6. `head.html` partial with full SEO meta tags
7. GitHub Actions deploy workflow
8. Migrate 2–3 stories as sample `.md` files to test everything
9. Contact form — "leave a message" via Cloudflare Worker + Email Routing + Turnstile
10. About/Contact page
