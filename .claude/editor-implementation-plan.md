# `tools/editor.html` — implementation status & next steps

Use this doc to pick up work on the story editor tool in a fresh conversation. It covers what was built, what's been verified, and what still needs testing/fixing.

## What this is

A single self-contained HTML+JS file (`tools/editor.html`) the blog author's non-technical brother opens directly from disk (`file://`) to create and edit Hebrew short stories, without using git or a terminal. On save, it commits straight to GitHub via the REST API.

## Architecture (decided, do not re-litigate without good reason)

- **No git, no OAuth, no backend.** All GitHub interaction is client-side `fetch()` to the Contents API (`https://api.github.com/repos/shooting-star-blog/blog/contents/...`).
- **Auth = pasted fine-grained Personal Access Token** (scoped to `shooting-star-blog/blog`, Contents read/write), stored in `localStorage` under key `ssb_editor_gh_token`. Verified once via `GET https://api.github.com/user`.
- **file:// + fetch to api.github.com works** because GitHub's API sends `Access-Control-Allow-Origin: *` and the request only carries an `Authorization` header (no cookies).
- Pushes go straight to `main` (the only branch; deploy workflow only triggers on push to `main`).
- **Deliberately out of scope for this version:** markdown editor/preview (plain `<textarea>` is used), cover-image upload. The `cover` field is hidden from the form entirely (not just text-passthrough) — existing values are preserved on save but can't be set/edited until image upload ships in phase 2.
- Single inline `<style>`/`<script>` in one HTML file — no build step, no sibling JS/CSS files (so it stays a "email one file to my brother" tool).

Full original design rationale is in `/home/sabichos/.claude/plans/sharded-finding-koala.md` (may not persist across environments — this doc is the durable copy).

## Confirmed safe / non-interfering

- `config.toml` has no `[module.mounts]`/`ignoreFiles`; Hugo only scans `content/`, `layouts/`, `static/`, `assets/`, `data/`, `i18n/`, `archetypes/`, `themes/`.
- `.github/workflows/deploy.yml` runs `hugo --minify` and uploads only `./public/`.
- Verified by actually running `./bin/hugo --minify` and confirming `public/` has zero trace of `tools/`.

## What's implemented in `tools/editor.html`

- Views: auth (PAT entry) → menu (new/edit/logout) → story list (edit mode) → shared create/edit form.
- `slugify()` — derives a slug from `title_en`, auto-updates until the user manually edits the slug field.
- `parseFrontmatter()` / `serializeStory()` — hand-rolled line-based frontmatter parser (not full YAML), built against the real field set: `title, title_en, date, description, description_en, cover, tags, featured, draft`.
  - `draft` omitted when false, only written as `draft: true` when true (matches majority of existing files).
  - Missing `cover` defaults to `""` on read; always written explicitly on save.
  - Unrecognized frontmatter lines (e.g. `void-shrub.md`'s extra `slug:` line) are preserved verbatim via an `extraLines` passthrough.
  - If a known field's quoted value doesn't close on the same physical line (e.g. `divinities.md`'s YAML-folded multi-line `description`), parsing aborts with a Hebrew "too complex, contact the developer" error rather than corrupting the file.
- `ghListStories()` / `ghGetFile()` / `ghPutFile()` / `ghDeleteFile()` — Contents API wrappers, with UTF-8-safe base64 encode/decode (plain `atob`/`btoa` would mangle Hebrew).
- Auth view: separate "בדוק חיבור" (validate) button calls `GET /user` with the pasted token; only on success does it enable the "שמור והתחבר" (save) button. Editing the token field after a successful validation re-disables save until re-validated.
- Save flow: explicit "לשמור ולפרסם?" confirmation step before every push (deliberate friction against GitHub Pages' soft build-rate limit — no autosave).
- Publish counter: next to the save button, a small label (`#publishCounter`) shows `N/10 פרסומים בשעה האחרונה`, backed by a local timestamp log in `localStorage['ssb_editor_publish_log']` (pruned to a rolling 60-minute window on every render). Turns to a `warn` style at 8+, `danger` at 10+. A rename counts as two pushes (create + delete) and is recorded as such. This is a local, per-browser estimate, not a real query against GitHub — it can't see publishes made from other browsers/devices. An adjacent "ⓘ" tooltip (hover/focus, `.info-tooltip`) explains the GitHub Pages build-rate limit and why renames count double.
- Conflict handling: a 409 (stale `sha`) shows a dialog offering to either keep local edits + refresh the `sha`, or discard local edits and reload the server version.
- Rename handling: if the slug changes while editing, creates the new file first, then deletes the old one only after the create succeeds — confirmation copy calls this out explicitly.
- Validation: required fields (`title`, `title_en`, `date`, non-empty `body`), slug format check, and a slug-collision check against a fresh story listing before creating/renaming.
- Story list (edit mode): each entry is enriched with the Hebrew `title` and `draft` flag (fetched + frontmatter-parsed per file) and a "last updated" timestamp (from `GET /commits?path=...&per_page=1`, one extra request per file). Draft stories show a "טיוטה" badge. A sort `<select>` toggles between alphabetical-by-Hebrew-title (default, `localeCompare` with `'he'`) and last-updated-first. If a file's frontmatter fails to parse (e.g. `divinities.md`), the list falls back to showing its slug and sorts it last in "updated" mode rather than blocking the whole list.
- Back-button dirty check: `renderForm()` snapshots `collectFormToFields()` as JSON right after populating the DOM (`state.pristineSnapshot`). The back button re-collects and compares; if unchanged, it navigates immediately with no confirm dialog. The confirm dialog's target view is `state.mode === 'edit' ? 'list' : 'menu'` (previously always `'menu'`, which dropped users out of the edit flow entirely instead of back to the story list).

## What's been verified

Automated (via Node — no browser involved). Extracted the pure logic functions from the script and ran them directly against the **real content files** in `content/stories/`:
- 31/31 real story files parse successfully and round-trip correctly (all field values and body text preserved exactly; only cosmetic normalization like adding a missing `cover: ""` or moving an unrecognized line to the end of the frontmatter block).
- `content/stories/divinities.md` (the one file with a genuinely multi-line YAML value) correctly triggers the defensive parse-failure error instead of corrupting content.
- `slugify()` spot-checked against a few inputs including accented Latin characters.
- JS syntax validated with `new Function(...)` on the extracted script.
- Confirmed `tools/` is invisible to the Hugo build (see above).

Manual, in a real browser (author-confirmed):

1. **Opened `tools/editor.html` via `file://`** and clicked through every view (auth → menu → new story → edit story → list → conflict dialog → rename flow).
   - Story list: title/draft badge rendering and both sort modes (alphabetical vs. last-updated) confirmed, including the fallback-to-slug case for a file that fails to parse.
   - Form back button: no dialog when nothing changed, dialog appears when something changed, lands on the story list when editing vs. the menu when creating new.
2. **Generated a real fine-grained PAT** scoped to `shooting-star-blog/blog` (Contents read/write); login flow confirmed: token verification, username display, persistence across reloads, logout/clear.
3. **Created one throwaway test story end-to-end**:
   - Commit landed on `main` with correctly formatted frontmatter (clean diff against existing file style).
   - GitHub Pages build triggered and the story appeared live.
   - Test story deleted/cleaned up afterward.
4. **Edited an existing story** (`void-shrub.md`, with the nonstandard extra `slug:` line) through the real UI — diff on GitHub was clean.
5. **Opened `divinities.md` for edit** through the real UI — the "too complex" message displayed correctly via the actual list → open click path.
6. **Tested the 409 conflict path**: opened the same story in two browser tabs, saved from both — second save showed the conflict dialog rather than silently overwriting, and both resolution buttons (keep mine / discard mine) behaved correctly.
7. **Tested a slug rename** on an existing story — produced two clean commits (create new, delete old), no broken intermediate state.
8. **Cross-browser check** done (at minimum Chrome/Edge) — `file://` + fetch behavior confirmed working.
9. Error-message wording/UX reviewed live, not just spec'd.

## Theming (done)

- `tools/editor.html`'s color tokens (`--bg`, `--panel`, `--border`, `--text`, `--muted`, `--accent`, `--accent-text`) now mirror the exact hex/rgba values from `assets/css/main.css`'s dark (`[data-theme="dark"]`) and light (`[data-theme="light"]`) palettes, so the editor tool visually matches the public site.
- Added a light/dark toggle button in the editor's header (`#themeToggleBtn`), styled like the site's `.ss-theme-btn` but with its own class (`.theme-toggle-btn`) since the editor is a single self-contained file with no shared CSS.
- Persists the choice to `localStorage['ssb_editor_theme']` (separate key from the site's `ss-theme` — different origin anyway under `file://`) and applies it before first paint via an early inline `<script>` in `<head>`, same pattern as `layouts/_default/baseof.html`.
- Verified in an actual browser as part of item 1 above — both themes and the toggle confirmed working.

## Planned / not yet built

- **Batch publishing.** Author wants to queue up multiple story creates/edits and push them as one publish action instead of one GitHub Pages build per save. Motivated directly by the 10-builds/hour soft limit the [publish counter](#whats-implemented-in-toolseditorhtml) above now surfaces — batching is the real fix; the counter is just a stopgap warning until this exists.
  - Open design questions for whoever picks this up: does "batch" mean multiple files in a single commit (one Contents API call can only touch one file — batching would need the Git Data API: create blobs → tree → commit → update ref, a materially bigger change than the current per-file `ghPutFile`/`ghDeleteFile` calls), or just queuing several saves client-side and firing them in sequence with a delay (simpler, but still N builds, just spread out)?
  - Whatever lands should keep updating the same `#publishCounter` / `ssb_editor_publish_log` mechanism so the count stays accurate (e.g. a batch of 3 files in one commit should record as 1 publish, not 3).
- No markdown editor/preview — plain textarea by design for this version.
- No cover-image upload — text field only, images added manually for now.

## Known deliberate limitations (do not "fix" these — they're intentional MVP scope cuts)

- No general YAML support — the parser intentionally bails out rather than handling arbitrary frontmatter shapes.
- Single flat file, no framework, no build step — this is intentional for portability, not an oversight.
