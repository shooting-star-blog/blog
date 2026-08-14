# Contact form worker

Receives the "leave a message" form from the About page and forwards it by
email through Cloudflare Email Routing, so the real inbox address is never
shipped to the browser. Free on Cloudflare's Workers + Email Routing +
Turnstile tiers.

Note: the `send_email` binding used here belongs to Cloudflare's Email
Service, which is in **public beta** (graduated from private beta in April
2026) — should be enablable from the dashboard without a waitlist, but it's
not GA yet.

## One-time setup (Cloudflare dashboard)

1. **Email Routing** — in the Cloudflare dashboard for `shooting-star-blog.com`,
   go to Email > Email Routing, enable it, and verify
   `shootingstarblog@outlook.com` as a destination address (a confirmation
   email is sent to that inbox). Then add a custom address
   `contact@shooting-star-blog.com` routed to that destination — this is the
   masked, public-facing alias.
2. **Turnstile** — go to Turnstile in the dashboard, create a widget for
   `shooting-star-blog.com`. Copy the **site key** (public — goes in the
   Hugo site's `config.toml` as `turnstileSiteKey`) and the **secret key**
   (private — set as a Worker secret, see below).

## Deploy

```sh
cd workers/contact
npm install
npx wrangler login          # once, opens a browser to authorize
npx wrangler deploy         # creates the worker and prints its URL
npx wrangler secret put TO_ADDRESS         # paste the real inbox address
npx wrangler secret put TURNSTILE_SECRET   # paste the Turnstile secret key
```

Deploy *before* setting secrets — running `wrangler secret put` against a
worker that doesn't exist yet will offer to create a bare placeholder for
you, which is not the same as a real deploy of `src/index.js` and won't show
up as a proper project in the dashboard.

`TO_ADDRESS` is deliberately a **secret**, not a `[vars]` entry in
`wrangler.toml` — this repo is public, and a `[vars]` value would be
committed in plaintext, defeating the whole point of masking the real
inbox. Secrets set via `wrangler secret put` live only on Cloudflare, never
in a file in this repo.

`wrangler deploy` prints the worker's URL, e.g.
`https://shooting-star-contact.<your-subdomain>.workers.dev`. Put that in
the Hugo site's `config.toml` as `contactFormEndpoint`. It also then appears
under Workers & Pages in the dashboard.

The Turnstile widget's dashboard may show a "Siteverify isn't being called"
warning until the worker has actually processed one real form submission
(that's the first time it calls Turnstile's siteverify endpoint) — expected
until then, not a sign anything is broken.

## Testing the deployed worker from `hugo server`

The worker only accepts requests whose `Origin` header is in
`ALLOWED_ORIGINS` (`wrangler.toml`), which already includes
`http://localhost:1313` (Hugo's default dev port) alongside the production
domain — so running `hugo server -D` locally and submitting the form there
hits the real deployed worker and sends a real email, no extra setup needed
on the worker side.

The one separate gotcha: **Turnstile widgets are scoped to specific
hostnames** in the dashboard (Turnstile > your widget > settings), independent
of the worker's own origin check. If `localhost` isn't in that widget's
hostname list, the Turnstile challenge itself may fail to render or verify
during local testing — add it there if that happens.

## Local-only testing (no real email sent)

```sh
npx wrangler dev
```

`wrangler dev` can't fully emulate the `send_email` binding, so use it only
to check request validation (honeypot, missing message, bad origin) — not
to confirm delivery. For that, test against the deployed worker as above.

## Redeploying after changes

This worker changes rarely. After editing `src/index.js`, just run
`npx wrangler deploy` again — no CI pipeline is set up for it, on purpose,
to keep it separate from the Hugo site's automatic GitHub Pages deploy.
