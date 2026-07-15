# `tools/editor.html` — implementation status & next steps

Use this doc to pick up work on the story editor tool in a fresh conversation. It covers what was built, what's been verified, and what still needs testing/fixing.

## What this is

A single self-contained HTML+JS file (`tools/editor.html`) the blog author's non-technical brother opens directly from disk (`file://`) to create and edit Hebrew short stories, without using git or a terminal. On save, it commits straight to GitHub via the REST API.

## Architecture (decided, do not re-litigate without good reason)

- **No git, no OAuth, no backend.** All GitHub interaction is client-side `fetch()` to the Contents API (`https://api.github.com/repos/shooting-star-blog/blog/contents/...`).
- **Auth = pasted fine-grained Personal Access Token** (scoped to `shooting-star-blog/blog`, Contents read/write), stored in `localStorage` under key `ssb_editor_gh_token`. Verified once via `GET https://api.github.com/user`.
- **file:// + fetch to api.github.com works** because GitHub's API sends `Access-Control-Allow-Origin: *` and the request only carries an `Authorization` header (no cookies).
- Pushes go straight to `main` (the only branch). **Today**, the deploy workflow triggers on every push to `main`; **phase 2** (see "Deploy decoupling" below) changes this so only the *last* commit of a multi-file save actually triggers a build — earlier commits in the same save are tagged to skip it.
- **Deliberately out of scope for this version:** markdown editor/preview (plain `<textarea>` is used). **Cover-image upload is phase 2** — designed in detail in "Cover image upload — planned design" below, not yet built. Until it ships, the `cover` field stays hidden from the form entirely (not just text-passthrough); existing values are preserved on save but can't be set/edited.
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

## Deploy decoupling for multi-commit saves (implemented, not yet verified live)

Decided 2026-07-14 during brainstorming, implemented 2026-07-15. Directly motivated by the rename flow already needing 2 file commits per save (create + delete) against the 10-builds/hour GitHub Pages soft limit — and by cover images (still not built, see below) needing even more. **Fully replaces the earlier "batch publishing" idea** (previously documented here as needing the Git Data API) — once a push no longer implies a build, commit count stops mattering for build-rate purposes, which was the entire problem batch publishing was trying to solve.

Considered and rejected a fancier version first (`workflow_dispatch` + an explicit Actions API call at the end of each save) — rejected because it needed `Actions: read and write` added to the fine-grained PAT, a breaking change to the already-issued token, for no actual benefit over the simpler mechanism below.

**What changed:**
- [deploy.yml](.github/workflows/deploy.yml) keeps its existing `push: branches: [main]` trigger — no new trigger type. The job gained a guard: `if: "!contains(github.event.head_commit.message, '[skip-deploy]')"` ([deploy.yml:15](.github/workflows/deploy.yml#L15)). It's a job-level `if:`, so a skipped run doesn't even spin up a runner.
- [tools/editor.html](tools/editor.html)'s `performSave()`: for a rename, the create-commit's message gets a `[skip-deploy]` suffix; the delete-commit's message (issued second, and always last if it runs at all) stays untagged, so it's the one whose ordinary push triggers the build. For a non-rename save (single commit), nothing needed to change — it was already the "last and only" commit.
- `recordPublish()` moved to fire exactly once, after the save's full commit sequence succeeds (previously it fired once per `ghPutFile`/`ghDeleteFile` call, so a rename logged 2). Now it logs 1 per save, matching that only one commit per save actually triggers a build.
- The in-app "ⓘ" tooltip next to the publish counter no longer claims renames count double (that line has been removed from both the `aria-label` and visible tooltip text) — it wasn't just stale copy, it would have actively undercounted the *remaining* headroom in a way that's fine (over-warns, doesn't under-warn) but was outright inaccurate.

**Why create-then-skip / delete-then-trigger, not the reverse:** if the create commit were untagged (triggers immediately) and the delete were tagged (skipped) and then failed, the old-slug page would stay live and stale — served forever until some unrelated future save happens to trigger a rebuild. With create tagged and delete untagged, a failed delete instead leaves the site exactly as it was pre-rename (nothing new went live), which is what the existing error message already tells the author to fix manually — and a manual delete via GitHub's own UI is untagged, so it self-heals by triggering a normal build.

**Not yet done:**
- Not yet tested against a real push/PAT — no live GitHub Actions run has confirmed the `if:` guard actually skips as expected. Next verification step: do a real rename through the tool and confirm exactly one Pages build fires (check the Actions tab), not two.
- Only wired into the rename path, since that's the only multi-commit save today. **Cover image upload (below) will need to reuse the same `[skip-deploy]` convention** once it's built — tag every commit in a save except the true last one.
- Scope is per-save, not session-level batch (multiple story edits queued, one explicit publish button) — that was considered and explicitly deferred. A true session-level batch would need a trigger decoupled from any specific commit (i.e., the rejected `workflow_dispatch` approach above), so revisit that design if batching becomes a real ask later.

## Cover image upload — planned design (not yet built)

Decided during brainstorming on 2026-07-14. Supersedes the "no cover-image upload" cut noted in Architecture above. Depends on "Deploy decoupling" above (that's what makes multi-file saves safe to do without minimizing commit count) — that infrastructure now exists for the rename path and needs to be reused here.

**Where images live, and why the client barely needs to optimize:** covers already go through a build-time Hugo Pipes pipeline — `layouts/partials/cover-image.html` calls `resources.Get` + `.Process("resize NxN webp")` for 3 responsive sizes (400/800/1200w), with `eager`/`fetchpriority` on the hero, `lazy`/`decoding=async` elsewhere, and explicit `width`/`height` to avoid CLS. **None of this needs to change** — confirmed via an actual `hugo --minify` build (output lands as `public/images/<slug>_hu_<hash>.webp`). Because those built filenames are fingerprinted/unpredictable before a real build runs, the editor **cannot** construct a "what it'll really look like live" preview URL — preview is necessarily local-only. Consequence: the editor's job is narrow — get a reasonable source image into `assets/images/`, named after the slug. Hugo does the actual performance work.

**Input handling:**
- Replace the currently-hidden `cover` field with a real `<input type="file" accept="image/*">` in the story form.
- Format allowlist: JPEG, PNG, WEBP. **Reject HEIC/HEIF explicitly** with a clear Hebrew error telling the author to export/share as JPEG — iPhone's default photo format can't be decoded via `<img>`/canvas outside Safari, and a HEIC-decode library (typically wasm, several hundred KB) conflicts with the "single flat file, no framework" constraint.
- Client-side pre-resize before upload: downscale via `<canvas>` so the longest edge is capped at ~1800–2000px, re-encoded at ~0.85 JPEG quality. This is **not** for site performance (Hugo re-encodes regardless) — it's repo hygiene, since unlike build output, source images get committed to git permanently, and phone photos can be 4000×3000+/8-12MB. The floor is deliberately kept above the largest Hugo target (1200w) so the hero image is never upscaled from a too-small source.
- Stored filename: `assets/images/<slug>.<ext>` — matches the existing convention (all 24 current covers follow this pattern), not the original uploaded filename.
- Add a short inline hint near the file input: landscape orientation preferred, minimum ~1200px width — the same cover renders at hero/list/card crops via `object-fit`, so portrait/tightly-cropped sources look worse at small crops.

**Preview:**
- New upload: `URL.createObjectURL(file)` into an `<img>`, sized/cropped to approximate the site's card CSS. Local-only, not pixel-perfect (see fingerprinting note above).
- Editing a story that already has a cover: fetch the existing file's bytes via the Contents API to show a "current cover" thumbnail before the author picks a replacement.

**Replace / remove / rename semantics** — three distinct cases, handled differently:
1. **Genuine replace or clear** (a different image is uploaded, or the cover is removed): move the old file aside rather than delete it — to `assets/images-inactive/<slug>__<timestamp>.<ext>`. This is a **sibling** folder to `assets/images/`, deliberately *not* nested under it, because `deploy.yml`'s build-cache key hashes `assets/images/**` ([deploy.yml:36](.github/workflows/deploy.yml#L36)) — keeping inactive files out of that tree avoids busting the cache on every replace. Timestamped so repeated replacements on the same story don't collide.
2. **Pure slug rename** (cover content unchanged, just needs a new filename to match the new slug): a straight rename — create under the new name, delete the old-named file outright. Not "unused," just relocated, so it does not go to `images-inactive/`.
3. **Restore previous cover**: a lightweight affordance shown right after a replace, offering to pull the image back from `images-inactive/` for that story. Deliberately **not** a general "browse all images" picker — reuse across stories isn't the workflow here (each story has one bespoke cover per the content model), and a full picker would cost an N+1 fetch+base64-decode per thumbnail, the same pattern the story list already pays for "last updated" timestamps. Revisit only if authors turn out to want to share art across stories.

**Push order and commit count:**
- Order: **image commit first, then the frontmatter commit.** If the second step fails, the result is an orphaned-but-harmless image commit rather than a story pointing at a 404 cover.
- Number of underlying file commits (image PUT, frontmatter PUT, old-file move/delete for replace or rename) **no longer needs to be minimized** — see "Deploy decoupling" above. Each stays a simple one-file `ghPutFile`/`ghDeleteFile` call; no Git Data API / multi-file atomic commit needed. Tag every commit but the true last one with `[skip-deploy]`, same as the rename path.

## Planned / not yet built

- No markdown editor/preview — plain textarea by design for this version.

## Known deliberate limitations (do not "fix" these — they're intentional MVP scope cuts)

- No general YAML support — the parser intentionally bails out rather than handling arbitrary frontmatter shapes.
- Single flat file, no framework, no build step — this is intentional for portability, not an oversight.
