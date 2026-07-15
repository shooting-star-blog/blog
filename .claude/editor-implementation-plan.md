# `tools/editor.html` — implementation status & next steps

Use this doc to pick up work on the story editor tool in a fresh conversation. It covers what was built, what's been verified, and what still needs testing/fixing.

## What this is

A single self-contained HTML+JS file (`tools/editor.html`) the blog author's non-technical brother opens directly from disk (`file://`) to create and edit Hebrew short stories, without using git or a terminal. On save, it commits straight to GitHub via the REST API.

## Architecture (decided, do not re-litigate without good reason)

- **No git, no OAuth, no backend.** All GitHub interaction is client-side `fetch()` to the Contents API (`https://api.github.com/repos/shooting-star-blog/blog/contents/...`).
- **Auth = pasted fine-grained Personal Access Token** (scoped to `shooting-star-blog/blog`, Contents read/write), stored in `localStorage` under key `ssb_editor_gh_token`. Verified once via `GET https://api.github.com/user`.
- **file:// + fetch to api.github.com works** because GitHub's API sends `Access-Control-Allow-Origin: *` and the request only carries an `Authorization` header (no cookies).
- Pushes go straight to `main` (the only branch). **Today**, the deploy workflow triggers on every push to `main`; **phase 2** (see "Deploy decoupling" below) changes this so only the *last* commit of a multi-file save actually triggers a build — earlier commits in the same save are tagged to skip it.
- **Deliberately out of scope for this version:** markdown editor/preview (plain `<textarea>` is used). **Cover-image upload is built** — see "Cover image upload" below for what shipped and what's still unverified.
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
- Publish counter: next to the save button, a small label (`#publishCounter`) shows `N/10 פרסומים בשעה האחרונה`, backed by a local timestamp log in `localStorage['ssb_editor_publish_log']` (pruned to a rolling 60-minute window on every render). Turns to a `warn` style at 8+, `danger` at 10+. **As of the deploy-decoupling change** (see below), a rename now records as **one** publish, not two — `recordPublish()` fires once, after the save's whole commit sequence succeeds, matching the fact that only the final (untagged) commit of a multi-commit save actually triggers a GitHub Pages build. This is a local, per-browser estimate, not a real query against GitHub — it can't see publishes made from other browsers/devices. An adjacent "ⓘ" tooltip (hover/focus, `.info-tooltip`) explains the GitHub Pages build-rate limit.
- Conflict handling: a 409 (stale `sha`) shows a dialog offering to either keep local edits + refresh the `sha`, or discard local edits and reload the server version.
- Rename handling: if the slug changes while editing, creates the new file first, then deletes the old one only after the create succeeds — confirmation copy calls this out explicitly.
- Validation: required fields (`title`, `title_en`, `date`, non-empty `body`), slug format check, and a slug-collision check against a fresh story listing before creating/renaming.
- Story list (edit mode): each entry is enriched with the Hebrew `title` and `draft` flag (fetched + frontmatter-parsed per file) and a "last updated" timestamp (from `GET /commits?path=...&per_page=1`, one extra request per file). Draft stories show a "טיוטה" badge. A sort `<select>` toggles between alphabetical-by-Hebrew-title (default, `localeCompare` with `'he'`) and last-updated-first. If a file's frontmatter fails to parse (e.g. `divinities.md`), the list falls back to showing its slug and sorts it last in "updated" mode rather than blocking the whole list.
- Back-button dirty check: `renderForm()` snapshots `collectFormToFields()` as JSON right after populating the DOM (`state.pristineSnapshot`). The back button re-collects and compares; if unchanged, it navigates immediately with no confirm dialog. The confirm dialog's target view is `state.mode === 'edit' ? 'list' : 'menu'` (previously always `'menu'`, which dropped users out of the edit flow entirely instead of back to the story list).

## What's been verified

Automated (via Node — no browser involved). Extracted the pure logic functions from the script and ran them directly against the **real content files** in `content/stories/`:
- 31/31 real story files parse successfully and round-trip correctly (all field values and body text preserved exactly; only cosmetic normalization like adding a missing `cover: ""` or moving an unrecognized line to the end of the frontmatter block). Re-verified 2026-07-15 against the now-33 real files (2 more stories added since) — still 33/33, no regressions from the cover-upload work below, which didn't touch these two functions.
- `content/stories/divinities.md` (the one file with a genuinely multi-line YAML value) correctly triggered the defensive parse-failure error instead of corrupting content as of the original 2026-07-13 verification; as of the 2026-07-15 re-check the file no longer has that multi-line shape (fixed independently, unrelated to the editor tool) and now parses normally — the defensive bail path itself is untested against any current real file, only against synthetic input.
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

## Deploy decoupling for multi-commit saves (implemented, not yet verified live)

Decided 2026-07-14 during brainstorming, implemented 2026-07-15. Directly motivated by the rename flow already needing 2 file commits per save (create + delete) against the 10-builds/hour GitHub Pages soft limit — and by cover images (built later the same day, see below) needing even more. **Fully replaces the earlier "batch publishing" idea** (previously documented here as needing the Git Data API) — once a push no longer implies a build, commit count stops mattering for build-rate purposes, which was the entire problem batch publishing was trying to solve.

Considered and rejected a fancier version first (`workflow_dispatch` + an explicit Actions API call at the end of each save) — rejected because it needed `Actions: read and write` added to the fine-grained PAT, a breaking change to the already-issued token, for no actual benefit over the simpler mechanism below.

**What changed:**
- [deploy.yml](.github/workflows/deploy.yml) keeps its existing `push: branches: [main]` trigger — no new trigger type. The job gained a guard: `if: "!contains(github.event.head_commit.message, '[skip-deploy]')"` ([deploy.yml:15](.github/workflows/deploy.yml#L15)). It's a job-level `if:`, so a skipped run doesn't even spin up a runner.
- [tools/editor.html](tools/editor.html)'s `performSave()`: for a rename, the create-commit's message gets a `[skip-deploy]` suffix; the delete-commit's message (issued second, and always last if it runs at all) stays untagged, so it's the one whose ordinary push triggers the build. For a non-rename save (single commit), nothing needed to change — it was already the "last and only" commit.
- `recordPublish()` moved to fire exactly once, after the save's full commit sequence succeeds (previously it fired once per `ghPutFile`/`ghDeleteFile` call, so a rename logged 2). Now it logs 1 per save, matching that only one commit per save actually triggers a build.
- The in-app "ⓘ" tooltip next to the publish counter no longer claims renames count double (that line has been removed from both the `aria-label` and visible tooltip text) — it wasn't just stale copy, it would have actively undercounted the *remaining* headroom in a way that's fine (over-warns, doesn't under-warn) but was outright inaccurate.

**Why create-then-skip / delete-then-trigger, not the reverse:** if the create commit were untagged (triggers immediately) and the delete were tagged (skipped) and then failed, the old-slug page would stay live and stale — served forever until some unrelated future save happens to trigger a rebuild. With create tagged and delete untagged, a failed delete instead leaves the site exactly as it was pre-rename (nothing new went live), which is what the existing error message already tells the author to fix manually — and a manual delete via GitHub's own UI is untagged, so it self-heals by triggering a normal build.

**Not yet done:**
- Not yet tested against a real push/PAT — no live GitHub Actions run has confirmed the `if:` guard actually skips as expected. Next verification step: do a real rename through the tool and confirm exactly one Pages build fires (check the Actions tab), not two.
- Was originally wired only into the rename path; cover image upload (below) now reuses the same `[skip-deploy]` convention — every commit in a save is tagged except the true last one.
- Scope is per-save, not session-level batch (multiple story edits queued, one explicit publish button) — that was considered and explicitly deferred. A true session-level batch would need a trigger decoupled from any specific commit (i.e., the rejected `workflow_dispatch` approach above), so revisit that design if batching becomes a real ask later.

## Cover image upload (implemented 2026-07-15, not yet verified live)

Built per the design decided during brainstorming on 2026-07-14, with three specific decisions pinned down at build time after discussion (see "Decisions made at build time" below). Depends on "Deploy decoupling" above (that's what makes multi-file saves safe to do without minimizing commit count) — reused here.

**Where images live, and why the client barely needs to optimize:** covers already go through a build-time Hugo Pipes pipeline — `layouts/partials/cover-image.html` calls `resources.Get` + `.Process("resize NxN webp")` for 3 responsive sizes (400/800/1200w). **None of this changed.** Because built filenames are fingerprinted/unpredictable before a real build runs, the editor cannot construct a "what it'll really look like live" preview URL — preview is local-only by necessity. The editor's job stays narrow: get a reasonable source image into `assets/images/`, named after the slug.

**Decisions made at build time** (asked of the user rather than assumed, per their explicit instruction):
1. **Output format: preserve source format**, not always-convert-to-JPEG. JPEG in → JPEG out (0.85 quality), PNG in → PNG out (lossless), WEBP in → WEBP out (0.85 quality). Chosen over "always JPEG" (which would have been simpler and matched the pre-existing all-JPEG convention) to keep transparency available for a PNG cover if ever needed.
2. **EXIF orientation is corrected** before resizing. Phone photos (the expected upload source) carry an EXIF orientation tag; drawing straight to `<canvas>` without reading it would have baked a sideways/upside-down image into the permanently-committed source file. Implemented as a minimal hand-rolled JPEG APP1/Exif-segment parser (`getJpegOrientation`) — no library.
3. **The "restore previous cover" affordance was built now**, not deferred, despite being more complex than the core replace/remove/rename flow.

**What was implemented, in `tools/editor.html`:**
- A real cover section in the story form (file input, current/pending preview thumbnails styled to a 4:3 crop approximating the site's card CSS, remove button, restore button, inline hint/warning/error text) — replacing the previous "field stays hidden entirely" cut.
- Format allowlist JPEG/PNG/WEBP via `detectCoverMime()`, with an explicit HEIC/HEIF rejection (`isHeicFile()`, checked by both MIME type and extension since some browsers leave `file.type` empty) telling the author to export as JPEG instead.
- `processCoverFile()`: validates → reads EXIF orientation for JPEG only (`safeGetJpegOrientation`, degrades to "no rotation" on any parse failure rather than throwing) → draws through an oriented intermediate `<canvas>` (`orientedCanvas()`, the standard 8-case orientation-to-transform-matrix mapping) → downscales via a second canvas pass so the longest edge is capped at 1900px, never upscaling (`scaleCanvasDown()`) → re-encodes in the source format (`encodeCanvas()`) → base64s the result for the GitHub API (`blobToBase64()`). A soft (non-blocking) warning shows if the *original* upload was narrower than 1200px.
- Binary-safe Contents API helpers added alongside the existing UTF-8-safe ones: `ghGetFileBase64()`, `ghPutFileBase64()`, `ghListDir()` (the last also used to enumerate `assets/images-inactive/` for the restore affordance).
- `buildCoverPlan()`: pure function computing the ordered list of image-file commits a save needs plus the final frontmatter `cover` value, covering all four `coverAction` states (`none`, `replace`, `remove`, `restore`) crossed with rename/no-rename. See "Replace / remove / rename semantics" and "Push order" below for the logic; see "What's been verified" for the automated coverage of every combination.
- `findInactiveCoverForSlug()`: lists `assets/images-inactive/`, filters by `<slug>__` prefix, picks the lexically-latest match (filenames use `Date.now()` — fixed-length numeric timestamps sort correctly as strings) to offer as the restore candidate when a story is opened for edit.

**Input handling:**
- File input replaces the old hidden `cover` field.
- Stored filename: `assets/images/<slug>.<ext>` (ext follows the *preserved* source format, so `.jpg`/`.png`/`.webp`), matching the existing convention.
- Inline hint: landscape orientation preferred, minimum ~1200px width — non-blocking, since the same cover renders at multiple crops via `object-fit`.

**Preview:**
- New upload: previewed only *after* processing (not the raw original) — `URL.createObjectURL()` on the already-resized/re-encoded `Blob`, so what's shown always matches what will actually be uploaded.
- Editing a story with an existing cover: its bytes are fetched via the Contents API (`ghGetFileBase64`) when the story is opened for edit, shown as a "current cover" thumbnail via a `data:` URL. If the frontmatter names a cover that 404s, a `coverMissingWarning` note offers to clear the stale reference.

**Replace / remove / rename semantics** — implemented in `buildCoverPlan()`:
1. **Genuine replace, remove, or restore**: the currently-active cover (if any) is *always* archived first — `assets/images-inactive/<slug>__<Date.now()>.<ext>` (a PUT) then a DELETE of the original path — even when the new upload will land at the exact same path (same slug + same extension, the common case). This ordering decision was made deliberately during implementation: archiving-then-adding means a failed add-new step leaves a temporarily broken cover image (recoverable via the restore button), whereas overwriting-in-place-then-archiving would have made the old copy unrecoverable via the Contents API for the common same-path case, defeating the restore feature for exactly the case it needs to cover most. `images-inactive/` is a sibling to `assets/images/`, not nested under it, so it doesn't bust `deploy.yml`'s `assets/images/**`-hashed build cache ([deploy.yml:36](.github/workflows/deploy.yml#L36)).
2. **Pure slug rename** (cover content unchanged, `coverAction === 'none'` but the slug changed): a straight relocate — PUT under the new name using the already-fetched original bytes, then DELETE the old name. Does not go through `images-inactive/`. Guarded: if the story had a cover but its bytes were never successfully fetched (a fetch failure when opening for edit), the save is blocked with a clear error rather than silently dropping the cover reference — checked both in `validateForm()` (before the confirm dialog) and defensively in `buildCoverPlan()` itself.
3. **Restore previous cover**: shown as a button when `findInactiveCoverForSlug()` finds a match; clicking it fetches those bytes and stages them as a pending "replace" (reusing the same archive-then-add machinery above), and additionally deletes the consumed `images-inactive/` entry once the restore's add-new step succeeds (best-effort cleanup — a failure there doesn't block or fail the save). Deliberately *not* a general cross-story image picker, per the original design reasoning.

Archive filenames are keyed by the story's **final** (post-save) slug, not its pre-rename slug, since that's what a future `findInactiveCoverForSlug()` lookup will search by.

**Push order and commit count:**
- Order per save: any cover archive/add/rename steps first (each tagged `[skip-deploy]`), then the story markdown commit(s) last — matching the existing rename path's pattern of exactly one untagged (build-triggering) commit at the very end of the whole save.
- No commit-count minimization needed (per "Deploy decoupling"); each step is a plain one-file `ghPutFileBase64`/`ghDeleteFile` call.

**What's been verified (automated, Node, no browser):**
- `node --check` on the extracted script — syntax OK.
- Pure-logic unit tests (43 assertions, all passing) covering: `coverExtOf`/`coverAssetPath`/`coverMimeForExt` edge cases; HEIC detection by MIME and by extension (case-insensitive); `detectCoverMime`'s type-then-extension fallback and its rejection of unsupported formats; `getJpegOrientation` against synthetic JPEG buffers with a hand-built minimal Exif/TIFF segment for orientations 1/3/6/8, plus safe degrade-to-1 on non-JPEG and empty buffers; and — most importantly — `buildCoverPlan()` exercised against all real combinations (none/replace/remove/restore × rename/no-rename, including the same-path collision case and the missing-original-cover-bytes guard), asserting the exact ordered commit paths/kinds and final `cover` field for each.
- Re-ran the pre-existing `parseFrontmatter`/`serializeStory` round-trip check (untouched by this work) against all 33 real files in `content/stories/` to confirm no regression — still round-trips correctly; `divinities.md` no longer has the multi-line-YAML edge case that used to force a parse-failure bail (fixed independently at some point, unrelated to this session).

**Not yet done — needs a real browser + a real GitHub push to confirm:**
- No actual file has been uploaded through the browser UI yet: canvas orientation-correction visual correctness, actual resize/quality output size, and the preview thumbnails have only been reasoned about and unit-tested at the logic level, not eyeballed.
- No real GitHub Contents API calls have been made for any cover operation (add/archive/rename/restore) — `ghGetFileBase64`/`ghPutFileBase64`/`ghListDir` are untested against the live API from this tool (the pre-existing `ghGetFile`/`ghPutFile`/`ghDeleteFile` used for stories were previously verified, but the binary-safe variants are new).
- The full save flow (cover steps + story commit, in order, with `[skip-deploy]` tags) has not been observed end-to-end against the Actions tab to confirm exactly one Pages build fires per save, matching what "Deploy decoupling" claims for the rename-only case today.
- HEIC rejection has not been tried with a real iPhone-exported HEIC file (only synthetic MIME-type/extension mocks in the Node tests).
- The "restore previous cover" round trip (replace → confirm archived copy appears in `images-inactive/` → restore → confirm it's back and the archived copy is cleaned up) has not been exercised live.

## Planned / not yet built

- No markdown editor/preview — plain textarea by design for this version.

## Known deliberate limitations (do not "fix" these — they're intentional MVP scope cuts)

- No general YAML support — the parser intentionally bails out rather than handling arbitrary frontmatter shapes.
- Single flat file, no framework, no build step — this is intentional for portability, not an oversight.
