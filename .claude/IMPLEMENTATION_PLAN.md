# Implementation Plan — כוכב נופל (Shooting Star) Blog

## How to Use This Document

1. **Work phases in order.** Do not start a phase until the previous phase's verification section passes completely.
2. **Tick checkboxes as you go.** Mark each task `[x]` in the Global Task List the moment it is complete — not in batches. A new conversation can resume by reading this file and starting at the first `[ ]`.
3. **Run `/simplify` at the end of every phase** before moving on. This keeps code clean without accumulating debt.
4. **One conversation per phase is the recommended cadence.** If context grows long, finish the current phase, run `/simplify`, commit, and open a fresh conversation starting from the next phase.

---

## Global Task List

Copy this block into each conversation and tick tasks as they complete.

```
PHASE 1 — Hugo Scaffold & Configuration
  [ ] 1.1  Verify Hugo extended ≥ 0.120 is installed
  [ ] 1.2  Run `hugo new site . --force` to initialize project structure
  [ ] 1.3  Write config.toml (language, RTL, baseURL, pagination, taxonomy, image pipeline)
  [ ] 1.4  Create full directory skeleton (layouts, assets, static, content, .github)
  [ ] 1.5  Add .gitignore (resources/_gen, public, .hugo_build.lock)
  [ ] 1.6  Smoke-test: `hugo server` runs at localhost with no errors

PHASE 2 — Design System & Base Templates
  [ ] 2.1  Write assets/css/main.css (dark theme, RTL, custom properties, focus styles, prefers-reduced-motion)
  [ ] 2.2  Write layouts/partials/head.html (fonts preconnect + load, charset, viewport)
  [ ] 2.3  Write layouts/partials/header.html (skip link, site nav, RTL-safe)
  [ ] 2.4  Write layouts/partials/footer.html (copyright notice, newsletter slot, nav)
  [ ] 2.5  Write layouts/_default/baseof.html (html[dir=rtl lang=he], wires all partials)
  [ ] 2.6  Verify: `hugo server` renders a page with Heebo + Frank Ruhl Libre, dark background, RTL layout, skip link present

PHASE 3 — Page Templates
  [ ] 3.1  Write layouts/index.html (featured stories grid with fallback to 6 most recent)
  [ ] 3.2  Write layouts/_default/list.html (paginated story cards with tag chips)
  [ ] 3.3  Write layouts/_default/single.html (story text, cover hero, tag chips, suggested stories, copyright)
  [ ] 3.4  Write layouts/taxonomy/tag.html (all stories for a given tag, reuse card partial)
  [ ] 3.5  Write layouts/partials/story-card.html (shared card used in list, homepage, taxonomy, suggested)
  [ ] 3.6  Write layouts/partials/suggested-stories.html (up to 3 related stories by tag, omit if empty)
  [ ] 3.7  Write layouts/partials/newsletter.html (Buttondown embed with labeled form, accessible)
  [ ] 3.8  Verify: all page types render correctly with stub content; tag pages reachable; suggested stories appear and are absent when empty

PHASE 4 — SEO & Structured Data
  [ ] 4.1  Complete layouts/partials/head.html: <title>, meta description, OG tags, hreflang, canonical
  [ ] 4.2  Add JSON-LD Article schema to single.html (headline, image, datePublished, author, inLanguage)
  [ ] 4.3  Add `lang="en"` wrapper around any English metadata rendered in HTML (title_en, description_en)
  [ ] 4.4  Configure custom RSS template (layouts/_default/rss.xml) truncated to description for copyright
  [ ] 4.5  Verify: view-source on a story page shows correct <title>, OG image, JSON-LD block, hreflang; RSS contains summaries only

PHASE 5 — Accessibility
  [ ] 5.1  Audit all templates: one <h1> per page, no skipped heading levels
  [ ] 5.2  Add aria-label to all icon-only links and tag chips ("סיפורים בנושא: <tag>")
  [ ] 5.3  Add aria-label / <label> to newsletter form input; add aria-live region for form feedback
  [ ] 5.4  Verify focus outline visible on all interactive elements (never `outline: none` without replacement)
  [ ] 5.5  Add `@media (prefers-reduced-motion: reduce)` block to main.css disabling all transitions/animations
  [ ] 5.6  Run axe-core CLI against `hugo server` output — fix all violations before continuing
  [ ] 5.7  Manual keyboard walkthrough: homepage → story list → single story → tag page → newsletter form → footer (Tab + Enter only)
  [ ] 5.8  Verify: axe-core reports 0 violations; all flows completable by keyboard

PHASE 6 — Image Pipeline
  [ ] 6.1  Create assets/images/ directory; confirm images go here (not static/) for Hugo processing
  [ ] 6.2  Configure image shortcode or partial: resize to 1200px max, convert to WebP, generate srcset at 400/800/1200px
  [ ] 6.3  Set hero cover image: loading="eager" fetchpriority="high"; all other images: loading="lazy"
  [ ] 6.4  Add <link rel="preload"> for story body font (Frank Ruhl Libre) on single story pages
  [ ] 6.5  Source and download 3 placeholder Pixabay images (one per test story), confirm WebP output ≤ 250 KB
  [ ] 6.6  Verify: Lighthouse Performance ≥ 90 on a story page; LCP ≤ 2.5s; images served as WebP in DevTools Network tab

PHASE 7 — CI/CD & Deployment
  [ ] 7.1  Write .github/workflows/deploy.yml (trigger: push to main; pin Hugo extended to specific version; build → deploy gh-pages)
  [ ] 7.2  Add static/CNAME file with the target domain (placeholder until domain is purchased)
  [ ] 7.3  Add resources/_gen/ to .gitignore OR commit it — decide and document the choice in a comment in deploy.yml
  [ ] 7.4  Enable GitHub Pages in repo settings: source = gh-pages branch
  [ ] 7.5  Push a test commit; confirm GitHub Actions runs green and site loads at github.io URL
  [ ] 7.6  Verify: GitHub Actions log shows "extended" Hugo version used; deployed site URL matches baseURL in config.toml

PHASE 8 — Content Migration
  [ ] 8.1  Create all 13 story .md files in content/stories/ with complete frontmatter (Hebrew + English fields, slug, tags, featured)
  [ ] 8.2  Source 13 cover images from Pixabay (thematically matched); download originals to assets/images/
  [ ] 8.3  Migrate full story text from Wix into each .md file (copy-paste + cleanup)
  [ ] 8.4  Set featured: true on 3–6 stories to populate the homepage grid
  [ ] 8.5  Confirm image processing output: WebP thumbnails ≤ 120 KB, hero images ≤ 250 KB
  [ ] 8.6  Verify: all 13 stories appear on the list page; featured set shows on homepage; each story's tag chips link to populated taxonomy pages; suggested stories section populated on stories that share tags

PHASE 9 — Launch Audit
  [ ] 9.1  Run Lighthouse on homepage, one story page, one tag page — all scores: Performance ≥ 90, SEO ≥ 95, Accessibility = 100, Best Practices ≥ 90
  [ ] 9.2  Run axe-core CLI on all three page types — 0 violations
  [ ] 9.3  Validate JSON-LD on a story page using Google's Rich Results Test
  [ ] 9.4  Submit sitemap.xml to Google Search Console; verify all 13 stories + tag pages are eligible for indexing
  [ ] 9.5  Test on real mobile device (or BrowserStack): RTL layout, font rendering, touch targets ≥ 44px, no horizontal scroll
  [ ] 9.6  Verify RSS feed at /index.xml: valid XML, contains summaries only (not full story text)
  [ ] 9.7  Verify newsletter form submits to Buttondown correctly (test email signup end-to-end)
  [ ] 9.8  Confirm annual cost: GitHub Pages (free) + domain (~$10) = total ≤ $10/year
```

---

## Phase 1 — Hugo Scaffold & Configuration

### Goal
A working Hugo project that builds without errors, serves locally over `hugo server`, and is correctly configured for Hebrew RTL, the `tags` taxonomy, pagination, and the extended image processing pipeline.

### Tasks

**1.1 — Verify Hugo extended ≥ 0.120**
```bash
hugo version
# Output must include "extended" and version ≥ 0.120
```
If not installed: `snap install hugo --channel=extended` or download from github.com/gohugoio/hugo/releases.

**1.2 — Initialize Hugo project**
```bash
cd /home/sabichos/Projects/shooting-star-blog
hugo new site . --force
```
`--force` is needed because CLAUDE.md and PRD.md already exist.

**1.3 — Write config.toml**

Key settings to include:
```toml
baseURL = "https://<username>.github.io/<repo>/"  # or custom domain later
languageCode = "he"
defaultContentLanguage = "he"
title = "כוכב נופל"

[params]
  description = "סיפורי מדע בדיוני ופנטזיה קצרים מאת ש.מ"
  author = "ש.מ"
  contactEmail = "shootingstarblog@outlook.com"

[taxonomies]
  tag = "tags"

[pagination]
  pagerSize = 12

[imaging]
  defaultProcessingTimeout = "60s"

[markup.goldmark.renderer]
  unsafe = false  # stories are author-controlled so safe to keep false
```

**1.4 — Create directory skeleton**
```
content/stories/
layouts/_default/
layouts/partials/
layouts/taxonomy/
assets/css/
assets/images/
static/
.github/workflows/
```

**1.5 — Add .gitignore**
```
public/
resources/_gen/
.hugo_build.lock
```

**1.6 — Smoke-test**
```bash
hugo server --buildDrafts
```
Expect: server starts at `localhost:1313`, no errors (even with empty templates).

### Gotchas (grilled)

- **Hugo regular vs extended:** The regular `hugo` binary cannot process images to WebP. `hugo version` must say `extended`. If a CI/CD environment installs the wrong binary, image processing silently fails and falls back to the original format.
- **baseURL subpath on GitHub Pages:** If the repo is *not* a `username.github.io` repo (i.e., it's a project repo like `username.github.io/shooting-star-blog`), the baseURL must include the subpath: `https://username.github.io/shooting-star-blog/`. A wrong baseURL breaks every internal link, CSS reference, and sitemap entry. Use a placeholder now; update before launch.
- **`--force` flag:** Without it, `hugo new site` aborts because the directory is non-empty. CLAUDE.md and PRD.md must not be deleted.
- **Hebrew slugs in URLs:** Hugo's default `slugify` function will percent-encode Hebrew characters in story URLs (e.g., `/stories/%D7%90%D7%A7%D7%99%D7%A8%D7%94/`). This is ugly and fragile. Prevent it by setting `slug` explicitly in each story's frontmatter using the English slug (e.g., `slug: "akira"`). This is handled in Phase 8 but must be designed for now.
- **Taxonomy configuration:** Hugo's default config in newer versions may not include `[taxonomies]` at all, relying on auto-detection. Explicitly declare `tag = "tags"` to avoid surprises and to be able to disable unwanted auto-taxonomies like `category`.
- **`resources/_gen/` decision:** Hugo caches image processing output here. Committing it to Git means CI builds are faster (no reprocessing) but adds binary files. Excluding it means CI rebuilds WebP every time (~seconds per image). Recommended: **exclude from Git, regenerate in CI** — Hugo is fast enough and this keeps the repo clean.

### Verification Checklist
- [ ] `hugo version` shows `extended` and ≥ 0.120
- [ ] `hugo server` starts without errors
- [ ] Directory tree matches the structure in CLAUDE.md
- [ ] `config.toml` has `languageCode = "he"`, `[taxonomies]`, `[pagination]`, `[imaging]`
- [ ] `.gitignore` excludes `public/`, `resources/_gen/`, `.hugo_build.lock`

### After Phase 1
Run `/simplify` on `config.toml` and `.gitignore`. Commit with message `feat: hugo scaffold and configuration`.

---

## Phase 2 — Design System & Base Templates

### Goal
Every page on the site shares a consistent base: dark space aesthetic, RTL Hebrew layout, Heebo (UI) + Frank Ruhl Libre (story body) fonts, a skip-to-content link, and a copyright-bearing footer. No page-specific content yet — just the shell.

### Tasks

**2.1 — assets/css/main.css**

Structure the file in this order:
1. CSS custom properties (colors, spacing, fonts, line-heights)
2. Reset / base (box-sizing, margin, RTL defaults)
3. Typography (Heebo for UI, Frank Ruhl Libre for `.story-body`)
4. Layout (header, main, footer, max-width containers)
5. Component stubs (nav, cards, chips — styled in later phases)
6. `@media (prefers-reduced-motion: reduce)` block
7. `@media` breakpoints (mobile-first: base = mobile, then min-width overrides)

Key values:
```css
--color-bg: #0d0d0d;
--color-surface: #161616;
--color-text: #e8e8e8;        /* contrast on bg: ~16:1 — exceeds AAA */
--color-accent: #7b61ff;      /* purple; verify 3:1 on bg for UI */
--font-ui: 'Heebo', sans-serif;
--font-body: 'Frank Ruhl Libre', serif;
--body-size: 19px;
--body-line-height: 1.8;
--column-width: 680px;
```

**2.2 — layouts/partials/head.html**

At minimum for this phase (SEO expanded in Phase 4):
```html
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{ if .IsHome }}{{ .Site.Title }}{{ else }}{{ .Title }} · {{ .Site.Title }}{{ end }}</title>
<!-- Google Fonts preconnect -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Heebo (UI) + Frank Ruhl Libre (body) — Hebrew subset required -->
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Frank+Ruhl+Libre:wght@400;500;700&display=swap&subset=hebrew" rel="stylesheet">
{{ $css := resources.Get "css/main.css" | minify }}
<link rel="stylesheet" href="{{ $css.RelPermalink }}">
```

**2.3 — layouts/partials/header.html**

Must include:
- Skip link as first element: `<a href="#main-content" class="skip-link">דלג לתוכן</a>`
- `<header role="banner">` wrapping a `<nav aria-label="ניווט ראשי">`
- Links: homepage (site title), "סיפורים" → `/stories/`, "אודות" → `/about/`
- Mobile: hamburger toggle (vanilla JS, or CSS-only checkbox trick — no JS framework)

**2.4 — layouts/partials/footer.html**

Must include:
- Full Hebrew copyright notice (verbatim from CLAUDE.md)
- Newsletter partial slot: `{{ partial "newsletter.html" . }}`
- Contact email link: `<a href="mailto:shootingstarblog@outlook.com">`
- `<footer role="contentinfo">`

**2.5 — layouts/_default/baseof.html**

```html
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>{{ partial "head.html" . }}</head>
<body>
  {{ partial "header.html" . }}
  <main id="main-content">{{ block "main" . }}{{ end }}</main>
  {{ partial "footer.html" . }}
</body>
</html>
```

**2.6 — Smoke-test**

Add a minimal `layouts/index.html`:
```html
{{ define "main" }}<h1>{{ .Site.Title }}</h1>{{ end }}
```
Run `hugo server` and verify visually.

### Gotchas (grilled)

- **Google Fonts Hebrew subset:** The default Google Fonts URL for Heebo/Frank Ruhl Libre does not include Hebrew glyphs unless `subset=hebrew` is appended. Without it, the browser falls back to a system font for Hebrew characters. Confirm the URL includes `&subset=hebrew`.
- **Frank Ruhl Libre Latin coverage:** Frank Ruhl Libre's Latin character set is limited. Any UI text in English (nav labels, error messages, date formatting) should use Heebo. Apply Frank Ruhl Libre only to `.story-body` to avoid rendering gaps.
- **`dir="rtl"` on `<html>`, not `<body>`:** Setting it on `<html>` is semantically correct and affects more elements (browser chrome, form controls). Setting it only on `<body>` misses some cases.
- **Skip link visibility:** The skip link must be visually hidden but focusable (not `display:none` or `visibility:hidden` — those remove it from tab order). Use the standard clip technique:
  ```css
  .skip-link { position: absolute; transform: translateY(-100%); }
  .skip-link:focus { transform: translateY(0); }
  ```
- **`id="main-content"` must exist:** The skip link's `href="#main-content"` is useless if the target `id` is missing from the template. The `<main>` in `baseof.html` must carry `id="main-content"`.
- **CSS minification in Hugo:** `resources.Get "css/main.css" | minify` requires Hugo extended and the file to be in `assets/`, not `static/`. If it's in `static/`, use a plain `<link>` but lose fingerprinting and minification.
- **`prefers-color-scheme`:** The site is intentionally dark (thematic choice). Do not add a light-mode toggle or media-query override in v1. Document this decision in a CSS comment so a future developer doesn't "fix" it.
- **Mobile hamburger in RTL:** In RTL layouts, the hamburger icon conventionally appears on the left (the start edge). CSS `margin-inline-start` and `margin-inline-end` should be used instead of `margin-left`/`margin-right` everywhere in the nav to be direction-agnostic.

### Verification Checklist
- [ ] `<html dir="rtl" lang="he">` present in page source
- [ ] Heebo and Frank Ruhl Libre load in browser DevTools → Network → Fonts
- [ ] Hebrew text renders in correct font (not system fallback)
- [ ] Skip link appears on Tab keypress; `href` resolves to `#main-content`
- [ ] Footer contains full Hebrew copyright notice
- [ ] Dark background, light text visible in browser
- [ ] No `outline: none` without a focus replacement in main.css

### After Phase 2
Run `/simplify` on `main.css`, `baseof.html`, `head.html`, `header.html`, `footer.html`. Commit with message `feat: design system and base templates`.

---

## Phase 3 — Page Templates

### Goal
All five page types render correctly: homepage (featured grid), story list (paginated, tagged cards), single story (body, cover, tags, suggested), tag taxonomy page, and About page. A shared `story-card` partial keeps markup DRY.

### Tasks

**3.1 — layouts/index.html** (Homepage)

Logic:
```
featured := where .Site.RegularPages "Params.featured" true | first 6
if len(featured) == 0:
    featured = first 6 of .Site.RegularPages sorted by date desc
```
Render as a CSS Grid of story cards. Include newsletter partial below the grid.

**3.2 — layouts/_default/list.html** (Stories list)

- Paginate with `.Paginator.Pages` (page size set in config.toml to 12)
- Each item: use `story-card` partial
- Include pagination controls at bottom (prev/next with RTL-appropriate arrow directions)

**3.3 — layouts/_default/single.html** (Individual story)

Structure:
1. `<article>` wrapping everything
2. Cover hero image (Phase 6 adds image processing; use `<img src="{{ .Params.cover }}">` as placeholder now)
3. `<h1>` with Hebrew title; optional English subtitle in `<p lang="en" class="subtitle">`
4. Tag chips row
5. Story body: `{{ .Content }}` wrapped in `<div class="story-body">` (triggers Frank Ruhl Libre font)
6. Copyright notice (repeated per-story, as required)
7. Suggested stories partial

**3.4 — layouts/taxonomy/tag.html** (Tag page)

- `<h1>`: "סיפורים בנושא: {{ .Title }}"
- List of story cards using the shared partial
- No pagination required in v1 (max ~13 stories total)

**3.5 — layouts/partials/story-card.html**

Parameters: a Page object. Renders:
- Cover image thumbnail
- Hebrew title (linked to story)
- Description excerpt (`.Params.description | truncate 120`)
- Tag chips (each links to `/tags/<slug>/`)
- Publication date (formatted Hebrew-style)

**3.6 — layouts/partials/suggested-stories.html**

Algorithm:
```
currentTags := .Params.tags
candidates := where .Site.RegularPages "Params.draft" false
  | where "Permalink" "!=" .Permalink   // exclude current story
  // keep only stories sharing ≥1 tag with current
  // sort by date desc, take first 3
render only if len(candidates) > 0
```

Hugo does not have a built-in "stories sharing a tag" query. Use a scratch approach or a range-with-if loop over all pages. Document this with a comment in the partial.

**3.7 — layouts/partials/newsletter.html**

```html
<section aria-labelledby="newsletter-heading">
  <h2 id="newsletter-heading">הירשמו לרשימת התפוצה</h2>
  <p>הירשמו ותדעו מתי מתפרסם הסיפור הבא</p>
  <!-- Buttondown embed — replace YOUR_USERNAME with real account -->
  <form action="https://buttondown.email/api/emails/embed-subscribe/YOUR_USERNAME"
        method="post" target="popupwindow"
        onsubmit="window.open('https://buttondown.email/YOUR_USERNAME', 'popupwindow')">
    <label for="bd-email">כתובת אימייל</label>
    <input type="email" id="bd-email" name="email" required
           placeholder="you@example.com" dir="ltr" autocomplete="email">
    <button type="submit">הירשמו</button>
  </form>
</section>
```

Note: `dir="ltr"` on the email input because email addresses are LTR text.

**3.8 — Smoke-test with stub content**

Create `content/stories/test-story.md` with frontmatter including `tags: ["מדע בדיוני"]` and `featured: true`. Verify all pages render.

### Gotchas (grilled)

- **`featured` field missing from older stories:** Hugo template access to `.Params.featured` returns `nil` (not `false`) when the field is absent from frontmatter. Use `{{ if (default false .Params.featured) }}` everywhere — not `{{ if .Params.featured }}`.
- **Homepage fallback logic:** The `where` function in Hugo returns an empty slice (not nil) when no pages match. Check `len` before rendering the grid, not a nil check.
- **Suggested stories — draft exclusion:** `where .Site.RegularPages "Params.draft" true` does not work reliably because Hugo already excludes draft pages from `.Site.RegularPages` in production mode. In `hugo server --buildDrafts` mode they appear. Use `{{ if not .Draft }}` within the loop to be safe in both modes.
- **Suggested stories — tag intersection in Hugo templates:** Hugo templates have no built-in set-intersection function. The cleanest approach is a `range` over the current story's tags and a nested `range` over all candidate pages, using a `$.Scratch` or `$seen` map to deduplicate. This must be tested with stories that share 0, 1, and multiple tags.
- **Tag chip links — Hebrew tag slugs are percent-encoded:** A tag named `מדע בדיוני` becomes `/tags/%D7%9E%D7%93%D7%A2-%D7%91%D7%93%D7%99%D7%95%D7%A0%D7%99/`. This is valid but visually ugly and fragile in some environments. Mitigation: use only ASCII tag slugs (English) or accept the encoding. Decide before Phase 8. If using Hebrew tags (as specified in PRD), confirm they render and link correctly in the browser.
- **Pagination arrow direction in RTL:** The "previous" (older) and "next" (newer) labels are reversed semantically in RTL reading direction. Use `→ הבא` and `הקודם ←` with CSS `transform: scaleX(-1)` on arrow icons, or simply use Hebrew text labels without arrows.
- **`story-card` partial context:** Hugo partials receive a single context argument. Pass the full Page object so the card can access `.Params`, `.RelPermalink`, and `.Site`. Do not pass a map — it loses access to Hugo's built-in page methods.
- **Email input direction:** Email addresses are always LTR. The `<input type="email">` inside an RTL form must have `dir="ltr"` explicitly to prevent the cursor and text from rendering right-to-left.
- **Buttondown embed security:** Buttondown's embed opens a popup. Some popup blockers block it. The form still submits via POST even if the popup is blocked — the user just won't see confirmation. This is acceptable behavior.

### Verification Checklist
- [ ] Homepage shows only `featured: true` stories; changes when frontmatter is toggled
- [ ] Homepage falls back to 6 most-recent when no story has `featured: true`
- [ ] Stories list page is paginated; pagination controls are keyboard-accessible
- [ ] Single story page shows story body in Frank Ruhl Libre font
- [ ] Tag chips on story cards link to correct taxonomy pages
- [ ] Taxonomy page lists all stories with that tag
- [ ] Suggested stories appear on stories sharing tags; section is absent on stories with unique tags
- [ ] Newsletter form renders with a `<label>` for the email input
- [ ] Email input has `dir="ltr"`

### After Phase 3
Run `/simplify` on all layout files and partials. Commit with message `feat: page templates and taxonomy`.

---

## Phase 4 — SEO & Structured Data

### Goal
Every page has complete, accurate meta tags. Story pages have JSON-LD `Article` schema. The RSS feed is truncated for copyright protection. `sitemap.xml` and `robots.txt` are correctly generated.

### Tasks

**4.1 — Complete layouts/partials/head.html**

Add to the Phase 2 stub:
```html
<!-- Canonical -->
<link rel="canonical" href="{{ .Permalink }}">

<!-- hreflang -->
<link rel="alternate" hreflang="he" href="{{ .Permalink }}">

<!-- Description -->
{{ with .Params.description }}
<meta name="description" content="{{ . }}">
{{ else }}
<meta name="description" content="{{ .Site.Params.description }}">
{{ end }}

<!-- Open Graph -->
<meta property="og:type" content="{{ if .IsPage }}article{{ else }}website{{ end }}">
<meta property="og:title" content="{{ .Title }}">
<meta property="og:description" content="{{ .Params.description | default .Site.Params.description }}">
<meta property="og:url" content="{{ .Permalink }}">
{{ with .Params.cover }}
<meta property="og:image" content="{{ . | absURL }}">
{{ end }}
<meta property="og:locale" content="he_IL">
<meta property="og:site_name" content="{{ .Site.Title }}">
```

**4.2 — JSON-LD on single story pages**

Add to `single.html` (not `head.html`, so it only appears on story pages):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ .Title }}",
  "inLanguage": "he",
  "datePublished": "{{ .Date.Format "2006-01-02" }}",
  "dateModified": "{{ .Lastmod.Format "2006-01-02" }}",
  "author": {
    "@type": "Person",
    "name": "{{ .Site.Params.author }}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "{{ .Site.Title }}"
  },
  {{ with .Params.cover }}"image": "{{ . | absURL }}",{{ end }}
  "description": "{{ .Params.description }}"
}
</script>
```

**4.3 — English metadata `lang` wrapper**

In `single.html`, wrap any rendered English fields:
```html
{{ with .Params.title_en }}
<p class="subtitle" lang="en">{{ . }}</p>
{{ end }}
```

**4.4 — Custom RSS template**

Create `layouts/_default/rss.xml` (copy Hugo's built-in as starting point, then modify the `<description>` element to use `.Params.description` rather than `.Content`). This protects full story text from appearing in feeds.

**4.5 — robots.txt and sitemap**

Hugo auto-generates both. In `config.toml`:
```toml
enableRobotsTXT = true
```
Hugo's `sitemap.xml` is at `/sitemap.xml` by default. No custom template needed unless exclusions are required.

### Gotchas (grilled)

- **Canonical URL accuracy:** `.Permalink` in Hugo is an absolute URL built from `baseURL` in config.toml. If `baseURL` has a trailing slash and `.Permalink` adds one too, the canonical URL may have a double slash. Test this explicitly on GitHub Pages before launch.
- **OG image must be absolute URL:** Relative URLs in `og:image` are not valid. Use `{{ .Params.cover | absURL }}` — not `.RelPermalink`. `absURL` prepends the full `baseURL`.
- **`og:locale` for Hebrew:** The correct locale code is `he_IL` (ISO 639 language code + ISO 3166 country code). `he` alone is not a valid OG locale.
- **JSON-LD in `<head>` vs `<body>`:** JSON-LD is valid in both locations. Placing it in `single.html` (body) rather than `head.html` avoids conditionals in `head.html` and keeps it closer to the content it describes. Google supports both placements.
- **Hugo's built-in RSS includes full content:** Hugo's default RSS template uses `{{ .Content }}` in `<description>`. A custom RSS template is mandatory to protect the author's copyrighted story text from being fully republished by RSS aggregators.
- **GitHub Pages robots.txt conflict:** GitHub Pages does not inject its own `robots.txt` if one exists at the site root. Hugo's `enableRobotsTXT = true` generates one during build. Confirm the deployed `robots.txt` is Hugo's (not a GitHub default) by checking `https://<site>/robots.txt` after Phase 7.
- **`dateModified` in JSON-LD:** Hugo's `.Lastmod` reflects the file's last Git commit date, not just the frontmatter `date`. This is correct behavior — if a story is edited and re-committed, `dateModified` updates automatically.

### Verification Checklist
- [ ] View-source on a story page: `<title>`, `<meta name="description">`, all OG tags, canonical, hreflang present
- [ ] `og:image` value is an absolute URL
- [ ] JSON-LD validates in Google's Rich Results Test (search.google.com/test/rich-results)
- [ ] RSS feed at `/index.xml` contains descriptions only, not full story HTML
- [ ] `https://<site>/sitemap.xml` lists all published stories and taxonomy pages
- [ ] `https://<site>/robots.txt` allows all crawlers (no Disallow rules)
- [ ] English subtitle (if any) rendered with `lang="en"` attribute

### After Phase 4
Run `/simplify` on `head.html`, `single.html`, `rss.xml`. Commit with message `feat: SEO meta tags, JSON-LD, and RSS`.

---

## Phase 5 — Accessibility

### Goal
The site passes WCAG 2.1 Level AA completely. axe-core reports zero violations. Every user flow is completable by keyboard alone. Screen readers receive meaningful labels for all interactive elements.

### Tasks

**5.1 — Heading hierarchy audit**

Walk every template and verify:
- Exactly one `<h1>` per rendered page
- Heading levels increment by 1 (no h1 → h3 jumps)
- The homepage `<h1>` is the site title or hero headline (not a card title)
- Story list page `<h1>` is "סיפורים" or equivalent
- Single story `<h1>` is the story title
- Tag page `<h1>` is "סיפורים בנושא: <tag>"

**5.2 — ARIA labels**

- All navigation landmarks: `<nav aria-label="ניווט ראשי">`, `<nav aria-label="ניווט עמוד">` (pagination)
- Tag chip links: `<a href="..." aria-label="סיפורים בנושא: {{ $tag }}">{{ $tag }}</a>`
- Suggested stories section: `<section aria-labelledby="suggested-heading">`
- Newsletter section: `<section aria-labelledby="newsletter-heading">`

**5.3 — Newsletter form**

The `<label for="bd-email">` must reference the input's `id`. Verify that Buttondown's embed code does not override or remove the label. Add `aria-required="true"` on the email input.

**5.4 — Focus indicators**

In `main.css`, add:
```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
```
Never `outline: none` unless a custom focus style immediately follows. Do a Tab-through of the page and take a screenshot at each focus stop.

**5.5 — prefers-reduced-motion**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**5.6 — axe-core scan**

```bash
npm install -g axe-cli
hugo server &
axe http://localhost:1313 --tags wcag2a,wcag2aa
axe http://localhost:1313/stories/ --tags wcag2a,wcag2aa
axe http://localhost:1313/stories/test-story/ --tags wcag2a,wcag2aa
```
Fix all reported violations before proceeding. Common issues to expect:
- Missing `alt` text on images
- Insufficient color contrast on tag chips or muted text
- Missing form label if Buttondown's JS overrides the DOM

**5.7 — Keyboard walkthrough**

Using only Tab, Shift+Tab, Enter, Space, and arrow keys:
1. Land on homepage → skip link visible on first Tab
2. Activate skip link → focus jumps to `#main-content`
3. Tab through nav links → each is reachable
4. Tab to a story card → Enter navigates to story
5. On story page → Tab through tag chips → Enter navigates to tag page
6. On story page → Tab to suggested stories → Enter navigates
7. Tab to newsletter form → fill email → Tab to button → Enter submits
8. Tab to footer links → reachable

**5.8 — Color contrast verification**

Using a contrast checker (e.g., WebAIM Contrast Checker):
- `#e8e8e8` on `#0d0d0d` → ~16:1 ✓ (body text, AAA)
- `#7b61ff` on `#0d0d0d` → verify ≥ 4.5:1 (UI elements — adjust accent if needed)
- Muted/secondary text (dates, subtitles) → must be ≥ 4.5:1

### Gotchas (grilled)

- **axe-core vs real screen reader:** axe-core catches rule violations but cannot verify logical reading order, meaningful link text in context, or whether ARIA announcements make sense. The keyboard walkthrough (5.7) compensates for this.
- **Buttondown JavaScript may modify the DOM:** Buttondown's embed JS sometimes replaces the `<form>` element's structure, which can remove the `<label>`. After the Buttondown account is created and the real embed code is inserted (Phase 8), re-run the accessibility check.
- **Contrast on tag chips:** A purple accent on a nearly-black background may fail 3:1 (for UI components). Test the exact hex values. If it fails, lighten the accent to `#9d87ff` or similar. Do not just "eyeball" this.
- **`aria-label` vs visible text:** If an element has both visible text and `aria-label`, the `aria-label` overrides the visible text for screen readers. Use `aria-labelledby` pointing to a visible heading where possible so sighted and non-sighted users receive the same label.
- **Touch target size:** WCAG 2.5.5 (AAA) and WCAG 2.5.8 (AA in 2.2) require touch targets ≥ 24×24px (AA) or 44×44px (AAA). Tag chips, nav links, and pagination buttons must have sufficient padding. Verify on a real mobile device or by inspecting computed styles.
- **`loading="lazy"` and accessibility:** Lazy-loaded images that are also `<a>` targets or described by `<figcaption>` are fine. But if an image is the only content of a link (e.g., a cover image card link with no text), the `<a>` needs an `aria-label` or the `<img>` needs descriptive `alt` text. The `story-card` partial must have text alongside the image link.

### Verification Checklist
- [ ] One `<h1>` per page across all five page types; no heading level skips
- [ ] All nav and section landmarks have `aria-label` or `aria-labelledby`
- [ ] Tag chip `aria-label` includes the tag name
- [ ] Email input has associated `<label>`
- [ ] `axe-core` reports 0 violations on homepage, list page, and story page
- [ ] Keyboard walkthrough (5.7) completes without getting stuck
- [ ] Contrast ratios verified: body text ≥ 4.5:1, large text ≥ 3:1, focus outline ≥ 3:1
- [ ] `prefers-reduced-motion` block present in CSS

### After Phase 5
Run `/simplify` on `main.css` and all partials touched in this phase. Commit with message `feat: WCAG 2.1 AA accessibility`.

---

## Phase 6 — Image Pipeline

### Goal
All cover images are sourced from Pixabay, processed by Hugo's extended image pipeline into WebP with responsive `srcset`, and served at appropriate sizes. LCP on story pages is ≤ 2.5 seconds. Story card thumbnails are ≤ 120 KB. Hero images are ≤ 250 KB.

### Tasks

**6.1 — Move images to assets/images/**

Images must live in `assets/images/` (not `static/images/`) for Hugo's `resources.Get` / `resources.GetMatch` pipeline to process them. The `cover` frontmatter field should use a path relative to `assets/` (e.g., `cover: "images/akira.jpg"`).

**6.2 — Image processing partial**

Create `layouts/partials/cover-image.html`:
```html
{{ $src := resources.GetMatch .cover }}
{{ if $src }}
  {{ $hero   := $src.Process "resize 1200x webp" }}
  {{ $tablet := $src.Process "resize 800x webp" }}
  {{ $mobile := $src.Process "resize 400x webp" }}
  <img
    src="{{ $hero.RelPermalink }}"
    srcset="{{ $mobile.RelPermalink }} 400w, {{ $tablet.RelPermalink }} 800w, {{ $hero.RelPermalink }} 1200w"
    sizes="(max-width: 480px) 400px, (max-width: 900px) 800px, 1200px"
    alt="{{ .altText }}"
    width="{{ $hero.Width }}"
    height="{{ $hero.Height }}"
    {{ if .eager }}loading="eager" fetchpriority="high"{{ else }}loading="lazy"{{ end }}
  >
{{ end }}
```

Call from `single.html` with `eager=true` and from `story-card.html` with `eager=false`.

**6.3 — Frank Ruhl Libre preload on story pages**

In `single.html`, add before `{{ partial "head.html" . }}` or via a template block:
```html
{{ define "extra-head" }}
<link rel="preload" as="font"
  href="https://fonts.gstatic.com/s/frankruhllibre/v..."
  crossorigin>
{{ end }}
```
The exact font file URL must be found from the Google Fonts CSS response. Preloading the font eliminates FOUT (Flash of Unstyled Text) on story pages, which improves both visual stability and CLS score.

**6.4 — Test with 3 placeholder images**

Source 3 Pixabay images appropriate for sci-fi themes. Download originals (≥ 1200px wide). Run `hugo build` and inspect `resources/_gen/images/` to confirm WebP files are generated. Check file sizes.

**6.5 — Verify `object-fit: cover` on cards**

Story card thumbnails must have consistent aspect ratio regardless of the source image's original proportions. In CSS:
```css
.story-card__image {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 100%;
}
```

### Gotchas (grilled)

- **`resources.GetMatch` vs `resources.Get`:** `resources.Get` requires an exact path from the `assets/` root. `resources.GetMatch` accepts glob patterns and is more forgiving. For the cover partial where the filename comes from frontmatter, `resources.Get` with the full path is more reliable.
- **Hugo image processing is cached in `resources/_gen/`:** This directory is in `.gitignore`. In CI, it will be regenerated every build. With 13 stories × 3 sizes = 39 image variants. Hugo processes these in parallel and is fast, but CI build time increases by ~10–30 seconds. This is acceptable.
- **WebP `width` and `height` attributes:** Always include explicit `width` and `height` on `<img>` elements. They allow the browser to reserve space before the image loads, preventing layout shift (CLS). Hugo's processed image objects expose `.Width` and `.Height`.
- **`fetchpriority="high"` browser support:** Supported in Chromium 101+ and Safari 17.2+. It's a hint, not a guarantee — older browsers silently ignore it. This is fine.
- **Font preload URL stability:** Google Fonts occasionally changes the URL path for hosted font files. The preload `href` may become stale after a Google Fonts update. An alternative is to self-host the font files in `static/fonts/` — this also eliminates the Google Fonts CDN dependency and third-party connection, improving privacy and potentially performance. Consider this for a post-launch improvement.
- **Pixabay image license:** Pixabay images are free for commercial and non-commercial use without attribution under the Pixabay License. However, Pixabay prohibits redistribution of the images "as-is" as part of a stock image service. A blog displaying them as cover art is clearly within the license terms. No attribution is legally required, but a brief credit in the image `alt` or a footer note is courteous.
- **Images in `static/` vs `assets/`:** If a future contributor places a new cover image in `static/images/` instead of `assets/images/`, the pipeline silently falls back (or errors). Add a note in the `static/images/` directory (e.g., a `README.txt`) directing contributors to use `assets/images/` instead.

### Verification Checklist
- [ ] `hugo build` generates WebP files in `resources/_gen/images/`
- [ ] Story card images have `loading="lazy"` and `aspect-ratio: 16/9` in CSS
- [ ] Story hero images have `loading="eager"` and `fetchpriority="high"`
- [ ] All `<img>` elements have explicit `width`, `height`, and `alt` attributes
- [ ] File sizes: card WebP ≤ 120 KB, hero WebP ≤ 250 KB (inspect DevTools → Network)
- [ ] Lighthouse Performance ≥ 90 on a story page
- [ ] LCP ≤ 2.5 seconds (Lighthouse → Diagnostics)
- [ ] No layout shift caused by images (Lighthouse CLS ≤ 0.1)

### After Phase 6
Run `/simplify` on the cover-image partial and any CSS changes. Commit with message `feat: image pipeline with WebP and responsive srcset`.

---

## Phase 7 — CI/CD & Deployment

### Goal
Pushing to `main` automatically builds the Hugo site and deploys it to GitHub Pages. The deployed site's URLs match the `baseURL` in `config.toml`. A `CNAME` file is preserved across deploys for when the custom domain is added.

### Tasks

**7.1 — .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # needed for .Lastmod from git history

      - name: Setup Hugo
        uses: peaceiris/actions-hugo@v3
        with:
          hugo-version: '0.128.0'  # pin exact version — update deliberately
          extended: true            # REQUIRED for WebP image processing

      - name: Build
        run: hugo --minify

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
          cname: your-domain.com  # placeholder; update when domain is purchased
```

**7.2 — static/CNAME**

Create `static/CNAME` with the target domain. Hugo copies `static/` to `public/` at build time, so CNAME persists across deploys without being managed by the deploy action separately.

> Using the `cname:` parameter in `peaceiris/actions-gh-pages` AND a `static/CNAME` is redundant — pick one. Recommended: use `static/CNAME` so it is version-controlled and visible.

**7.3 — GitHub Pages settings**

In repo Settings → Pages → Source: deploy from `gh-pages` branch, root directory. This is set once and is not part of the codebase.

**7.4 — Test push**

Push any change to `main`. Watch the Actions tab. Confirm the `extended` Hugo binary is used (visible in the Build step output). Navigate to `https://<username>.github.io/<repo>/` and verify the site loads.

**7.5 — Verify baseURL match**

The URL in the browser must exactly match `baseURL` in `config.toml`. Mismatches cause broken relative links in CSS, feeds, and sitemaps.

### Gotchas (grilled)

- **`fetch-depth: 0` for `.Lastmod`:** By default, `actions/checkout` does a shallow clone (depth 1). Hugo's `.Lastmod` is populated from Git history. Without a full checkout, all pages show the same `Lastmod` (the current commit). Fix: `fetch-depth: 0`.
- **Pin Hugo version:** Never use `hugo-version: 'latest'`. A Hugo major release can change template behavior, breaking the build silently or catastrophically. Pin to a specific version (e.g., `0.128.0`) and update deliberately.
- **`extended: true` in the workflow:** This is the second place (after local install) where extended must be enforced. If it's absent, image processing builds locally but fails or degrades in CI.
- **`GITHUB_TOKEN` permissions:** The default `GITHUB_TOKEN` may lack write permissions to the `gh-pages` branch if repo permissions are set to `read` by default. Add `permissions: contents: write` to the job.
- **CNAME file and gh-pages branch:** The `peaceiris/actions-gh-pages` action deploys a fresh copy of `public/` to the `gh-pages` branch on every run. If the CNAME file is not in `public/` (generated by `static/CNAME` → copied by Hugo build), the custom domain is cleared on every deploy — GitHub then throws a "domain removed" warning in the Pages settings.
- **GitHub Actions secrets for future use:** If Buttondown or any third-party service ever requires an API key (e.g., for a webhook), store it as a GitHub Actions secret, not in `config.toml` or any committed file. Even if there are no secrets now, note this in a comment in `deploy.yml`.
- **`hugo --minify`:** Minification reduces HTML/CSS/JS output size and improves performance. It can occasionally cause issues with inline JSON-LD (if the minifier mangles the script block). Verify the JSON-LD in the deployed build, not just in `hugo server`.

### Verification Checklist
- [ ] GitHub Actions run completes green on push to `main`
- [ ] Actions log shows Hugo version matching pinned value; `extended` binary confirmed
- [ ] Deployed site loads at correct GitHub Pages URL
- [ ] `<link rel="stylesheet">` and all asset URLs load without 404
- [ ] `static/CNAME` file present in the deployed `gh-pages` branch root
- [ ] JSON-LD not broken by minification (view-source on deployed story page)

### After Phase 7
Run `/simplify` on `deploy.yml`. Commit with message `feat: GitHub Actions CI/CD deploy workflow`.

---

## Phase 8 — Content Migration

### Goal
All 13 stories are live on the site with complete frontmatter, full story text, and matched Pixabay cover images processed through the WebP pipeline. Featured stories are set. Taxonomy pages for all used tags are populated.

### Tasks

**8.1 — Create all 13 story .md files**

For each story:
1. Create `content/stories/<english-slug>.md`
2. Fill out all frontmatter fields (see template in PRD §5.4)
3. Set `slug: "<english-slug>"` explicitly to prevent Hebrew URL encoding
4. Assign tags from the existing Wix story (or assign thematic tags if Wix tags are unavailable)
5. Set `draft: false`
6. Set `featured: true` on 3–6 stories (author's choice)

Story slugs:
```
days-of-love, the-drought, the-black-stone, double-atmosphere,
tomorrow-rich-again, nice-first-person, the-diamond, the-double,
on-the-seam, videohome, gas-balloon, the-box, akira
```

**8.2 — Migrate story text from Wix**

For each story:
1. Open the story on the Wix site (`shalev76.wixsite.com/shooting-star`)
2. Copy the full story text
3. Paste into the `.md` file below the frontmatter `---`
4. Clean up: remove Wix formatting artifacts, convert any inline styles to plain Markdown
5. Preserve paragraph breaks using blank lines between paragraphs

**8.3 — Source and download cover images**

For each story, find a thematically appropriate image on Pixabay:
- Search terms in English (Pixabay search works best in English)
- Prefer images ≥ 1200px wide (originals)
- Download full-size original
- Name file `<english-slug>.jpg` (or `.png`)
- Place in `assets/images/`

Suggested search keywords by story:
| Story | Suggested Pixabay search |
|-------|--------------------------|
| אקירה (Akira) | "cyberpunk city night" |
| היהלום (The Diamond) | "crystal diamond space" |
| הבצורת (The Drought) | "desert cracked earth" |
| האבן השחורה (The Black Stone) | "dark stone mysterious" |
| אטמוספירה כפולה (Double Atmosphere) | "double planet atmosphere" |
| הכפילה (The Double) | "mirror reflection person" |
| ימים של אהבה (Days of Love) | "futuristic romance" |
| גוף ראשון נחמד (Nice First Person) | "first person narrative space" |
| מחר נהיה שוב עשירים | "future city prosperity" |
| על התפירה (On the Seam) | "fabric seam cosmic" |
| וידאוהום (Videohome) | "retro screen glitch" |
| בלון גז (Gas Balloon) | "gas balloon sky sci-fi" |
| הקופסה (The Box) | "mysterious box glow" |

**8.4 — Run build and verify images**

```bash
hugo build
ls -lh resources/_gen/images/
```
Confirm WebP variants exist for all 13 stories. Check file sizes.

**8.5 — Set featured stories**

Choose 3–6 stories for `featured: true`. Verify homepage grid reflects the selection. Toggle one back to `false` and confirm it disappears from the homepage without affecting the story list.

**8.6 — Tag consistency check**

List all tags used across all 13 stories:
```bash
grep -h "tags:" content/stories/*.md
```
Ensure:
- Tags are consistent (no typos, no duplicate concepts with different spellings)
- Every tag has ≥ 2 stories (otherwise the taxonomy page shows a near-empty page — acceptable but worth noting)
- Tag slugs in URLs render correctly (test by navigating to each tag page)

### Gotchas (grilled)

- **Wix rich text to Markdown:** Wix exports story text with embedded HTML spans and divs. When pasted directly into Markdown, these render as raw HTML. Hugo's Goldmark processor handles safe HTML by default (`unsafe = false`). Strip all HTML tags during migration; rely only on Markdown paragraph breaks and `---` for section breaks.
- **Hebrew punctuation in Markdown:** Hebrew uses `״` (gershayim) for quotes and `׳` (geresh) for abbreviations. These are Unicode characters and Markdown renders them correctly. No special handling needed.
- **`slug` vs `url` frontmatter:** `slug` sets the last path segment (e.g., `akira`). `url` sets the full path (e.g., `/stories/akira/`). Use `slug` — it's less brittle if the content section is ever renamed.
- **Story text encoding:** Copy-paste from Wix may introduce non-standard Unicode spaces, directional marks (U+200F RIGHT-TO-LEFT MARK), or smart quotes. Run a text editor find/replace to clean up before committing.
- **Featured story count:** If the author wants more than 6 featured stories in the future, the template currently caps at 6. This is by design (PRD F-30). If more are marked `featured: true`, the 6 most recent are shown. Document this behavior in a comment in `index.html`.
- **Pixabay download size:** Pixabay originals can be 5–10 MB (JPEG). These are committed to `assets/images/`. Hugo processes them to WebP at build time. The repo size increases by ~100 MB for 13 original images. This is fine for a private GitHub repo. If repo size becomes a concern, use Git LFS.

### Verification Checklist
- [ ] All 13 stories appear on `/stories/` list page
- [ ] All 13 story slugs are ASCII (no percent-encoded Hebrew in URLs)
- [ ] Each story page has a cover image rendering as WebP
- [ ] All cover images load correctly; no broken image icons
- [ ] Featured stories grid on homepage matches `featured: true` stories
- [ ] At least 2–3 distinct tag taxonomy pages are populated with multiple stories
- [ ] Suggested stories section appears on stories sharing tags
- [ ] `hugo build` completes with 0 errors and 0 warnings

### After Phase 8
Run `/simplify` on frontmatter files if any patterns can be standardized (e.g., tag normalization). Commit with message `feat: migrate all 13 stories with cover images`.

---

## Phase 9 — Launch Audit

### Goal
Every success metric from the PRD is met before the domain is pointed at the site. The site is ready for public launch.

### Tasks

**9.1 — Lighthouse audit (three page types)**

```bash
# Install if not present
npm install -g lighthouse

# Run against deployed GitHub Pages URL (not localhost — lighthouse scores differ)
lighthouse https://<site>/              --output json --output-path lh-home.json
lighthouse https://<site>/stories/     --output json --output-path lh-list.json
lighthouse https://<site>/stories/akira/ --output json --output-path lh-story.json
```

Targets (all must pass):
| Category | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | 100 |
| Best Practices | ≥ 90 |
| SEO | ≥ 95 |

**9.2 — axe-core final scan**

```bash
axe https://<site>/ https://<site>/stories/ https://<site>/stories/akira/ \
    --tags wcag2a,wcag2aa --exit
```
`--exit` causes a non-zero exit code on violations, making this usable in CI.

**9.3 — Google Rich Results Test**

Navigate to search.google.com/test/rich-results and test the URL of one story page. Confirm the `Article` schema is detected without errors or warnings.

**9.4 — Google Search Console setup**

1. Add the site as a property in GSC
2. Verify ownership via the HTML meta tag method (add to `head.html`, redeploy)
3. Submit `https://<site>/sitemap.xml`
4. Check Coverage report after 24 hours for indexing status

**9.5 — Mobile device test**

On a real device (or BrowserStack):
- [ ] RTL layout correct; text flows right-to-left
- [ ] Fonts render correctly (Heebo for UI, Frank Ruhl Libre for story body)
- [ ] No horizontal scroll on any page
- [ ] Cover images load at appropriate size (check Network tab)
- [ ] Touch targets (nav, tag chips, story cards) are comfortably tappable
- [ ] Newsletter form usable on touch keyboard

**9.6 — RSS feed validation**

Submit `/index.xml` to validator.w3.org/feed. Fix any structural warnings.

**9.7 — Newsletter end-to-end test**

1. Submit a test email address via the newsletter form
2. Confirm subscription appears in Buttondown dashboard
3. Confirm confirmation email arrives

**9.8 — Cost audit**

Confirm the annual cost breakdown:
| Item | Cost |
|---|---|
| GitHub Pages hosting | $0 |
| Custom domain (Namecheap / Cloudflare) | ~$10 |
| Buttondown newsletter (free tier ≤ 100 subs) | $0 |
| Google Fonts | $0 |
| Pixabay images | $0 |
| **Total** | **~$10/year** |

### Gotchas (grilled)

- **Lighthouse on localhost vs deployed:** `hugo server` serves unminified output. The deployed GitHub Pages build uses `hugo --minify`. Always run the final Lighthouse audit against the deployed URL, not localhost. Scores can differ by 5–15 points.
- **Accessibility score of 100 is achievable but brittle:** A single missing `alt` attribute or incorrect ARIA role drops the score. Re-run after every content addition in Phase 8 to catch regressions from the migration.
- **Google Search Console ownership verification:** The HTML meta tag method requires the tag to remain in `<head>` permanently (it's checked on recurring crawls). Do not remove it after initial verification.
- **Sitemap indexing lag:** Google does not index all pages immediately after sitemap submission. The Coverage report may show 0 indexed pages for 24–72 hours. This is normal; check back after a few days.
- **Buttondown free tier limit:** Buttondown's free tier allows up to 100 subscribers. If the list grows past 100, a paid plan (~$9/month) is needed. This does not affect the site build — only the newsletter service. Note this threshold.
- **Domain propagation time:** After pointing a custom domain to GitHub Pages, DNS propagation can take up to 48 hours. GitHub Pages also needs time to provision the TLS certificate. Plan for 24–48 hours of partial availability after domain setup.
- **Decap CMS deferred to post-launch:** Decap CMS with GitHub Pages requires a third-party OAuth provider (Netlify Identity, or a custom GitHub OAuth app). This is non-trivial and is explicitly out of scope for v1. If the author finds Git CLI too difficult after launch, address Decap CMS as a separate project.

### Verification Checklist — Final Gates Before Launch
- [ ] Lighthouse: Performance ≥ 90, Accessibility = 100, SEO ≥ 95, Best Practices ≥ 90 (on deployed URL)
- [ ] axe-core: 0 violations on all page types
- [ ] JSON-LD valid in Google Rich Results Test
- [ ] Sitemap submitted to Google Search Console
- [ ] Mobile layout passes visual and interaction review
- [ ] RSS feed validates at validator.w3.org/feed
- [ ] Newsletter form end-to-end verified
- [ ] Annual cost confirmed ≤ $10
- [ ] All checkboxes in the Global Task List above are ticked

### After Phase 9
Run `/simplify` on any files touched during audit fixes. Final commit: `chore: launch audit fixes`. Tag the release: `git tag v1.0.0`.

---

## Edge Case Registry

The following edge cases were identified during plan review and are addressed inline in the phases above. This index maps each issue to where it is handled.

| # | Edge Case | Handled In |
|---|-----------|------------|
| 1 | Hugo regular vs extended binary (WebP requires extended) | Phase 1, Phase 7 |
| 2 | GitHub Pages subpath baseURL | Phase 1, Phase 7 |
| 3 | Hebrew slugs → percent-encoded URLs | Phase 1, Phase 8 |
| 4 | Google Fonts missing Hebrew subset | Phase 2 |
| 5 | Frank Ruhl Libre limited Latin coverage | Phase 2 |
| 6 | `dir="rtl"` on `<html>` not `<body>` | Phase 2 |
| 7 | Skip link must not use `display:none` | Phase 2 |
| 8 | `id="main-content"` must exist for skip link | Phase 2 |
| 9 | CSS in `assets/` required for Hugo pipeline | Phase 2, Phase 6 |
| 10 | `featured` field absent → Hugo returns nil not false | Phase 3 |
| 11 | Suggested stories: draft exclusion in server mode | Phase 3 |
| 12 | Suggested stories: tag intersection has no native Hugo function | Phase 3 |
| 13 | Pagination arrow direction in RTL | Phase 3 |
| 14 | `story-card` partial context must be Page object | Phase 3 |
| 15 | Email input must have `dir="ltr"` | Phase 3 |
| 16 | Buttondown JS may remove the `<label>` | Phase 3, Phase 5 |
| 17 | Canonical URL double-slash from trailing slash | Phase 4 |
| 18 | `og:image` must be absolute URL (`absURL`) | Phase 4 |
| 19 | `og:locale` must be `he_IL` not `he` | Phase 4 |
| 20 | Hugo default RSS includes full story content | Phase 4 |
| 21 | GitHub Pages does not override Hugo's robots.txt | Phase 4 |
| 22 | axe-core ≠ screen reader; keyboard walkthrough is required | Phase 5 |
| 23 | Tag chip contrast must be verified numerically, not visually | Phase 5 |
| 24 | Touch target size ≥ 24×24px (WCAG 2.5.8 AA) | Phase 5 |
| 25 | Images in `assets/` not `static/` for pipeline | Phase 6 |
| 26 | `resources._gen/` excluded from Git, regenerated in CI | Phase 1, Phase 6 |
| 27 | `width`/`height` on `<img>` prevents layout shift (CLS) | Phase 6 |
| 28 | `fetch-depth: 0` needed for `.Lastmod` from git history | Phase 7 |
| 29 | Hugo version must be pinned in CI | Phase 7 |
| 30 | CNAME file must be in `static/` to survive gh-pages deploys | Phase 7 |
