# CannaSpecific

Early-stage site for CannaSpecific, a Florida-first company building software that relates cannabis lab certificates (COAs) to real-world reviews. The public site is a waitlist and a pilot inquiry. It is not a medical product and it does not sell cannabis.

The app is a Vite/React client and an Express server in one Node process, so it fits a single Render free web service.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and client together, with reload |
| `npm run build` | Vite client into `dist/public`, server bundle into `dist/index.js` |
| `npm start` | Production server. Binds `0.0.0.0:$PORT` and creates the submissions table if it is missing |
| `npm test` | Validation, email config, rate limit, and a Postgres submission test |
| `npm run check` | TypeScript |
| `npm run db:push` | Optional drizzle-kit push. Not used on boot |

Render should keep using:

- **Build:** `npm install && npm run build` (or `npm ci && npm run build` if you install dev dependencies)
- **Start:** `npm start`

`npm start` used to run `drizzle-kit push` before the server. That command can prompt, and on a production install it depends on a dev dependency. Boot now applies `CREATE TABLE IF NOT EXISTS` itself. The legacy `interests` table is left in place.

## Environment variables

Copy `.env.example` to `.env` for local work. Set the same keys on the Render service. Never commit `.env`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes, to save forms | Neon/Postgres connection string. Without it the site still loads and the form returns a real error. |
| `DATABASE_SSL` | No | `disable` for local Postgres. Remote hosts use SSL automatically. |
| `RESEND_API_KEY` | Yes, to send mail | Resend API key. Preferred provider. If this and `SENDGRID_API_KEY` are both missing, submissions are still saved and the UI says the email was not sent. |
| `EMAIL_FROM` | No | From address for Resend. Defaults to `CannaSpecific <hello@cannaspecific.com>`. Verify that domain in Resend. A bad value disables mail instead of falling through to SendGrid. |
| `NOTIFY_EMAIL` | No | Owner notification inbox, and the reply-to address. Defaults to `cannaspecific@gmail.com`. |
| `SENDGRID_API_KEY` | Only if Resend is unset | Fallback provider. Ignored while `RESEND_API_KEY` is set. Remove it once Resend is working so a zero-credit SendGrid account is not used later. |
| `SENDGRID_FROM_EMAIL` | Only with the SendGrid key | Verified SendGrid from-address. Placeholder addresses are refused. See the DNS note below. |
| `SENDGRID_FROM_NAME` | No | SendGrid display name. Defaults to `CannaSpecific`. |
| `ADMIN_TOKEN` | Yes, for `/admin` | Secret for the submissions page and CSV export. Send it as `x-admin-token` or `Authorization: Bearer`. |
| `PORT` | Set by Render | Listen port. Local default is `5000`. |
| `RATE_LIMIT_MAX` | No | Form posts allowed per IP per window. Default `8`. |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window. Default 10 minutes. |

## Email

Resend is used when `RESEND_API_KEY` is set. Otherwise SendGrid is used when `SENDGRID_API_KEY` is set. If neither key is set, both the confirmation and the owner notice are recorded as `skipped`. The row is still saved. The form says the confirmation could not be sent. Provider errors, including Resend `Maximum credits exceeded`, are stored on the row as `failed` and are not thrown.

The default Resend from-address is `CannaSpecific <hello@cannaspecific.com>`. Resend must verify `cannaspecific.com` before that address can deliver. The existing SendGrid CNAMEs are on `www` only and do not authenticate Resend.

## SendGrid and DNS

This section applies only to the SendGrid fallback. Live DNS (checked October 24, 2026) authenticates **www.cannaspecific.com**, not the apex:

- `em17.www.cannaspecific.com` → `u57139562.wl063.sendgrid.net`
- `s1._domainkey.www.cannaspecific.com` → `s1.domainkey.u57139562.wl063.sendgrid.net`
- `s2._domainkey.www.cannaspecific.com` → `s2.domainkey.u57139562.wl063.sendgrid.net`

There is no matching authentication on `em17.cannaspecific.com` or `s1._domainkey.cannaspecific.com`. DMARC exists for the apex and for www (`p=quarantine`, relaxed alignment). No SPF TXT record was found on the apex. Domain authentication here uses the SendGrid CNAME method on the www host.

What to set:

1. In SendGrid, confirm the authenticated domain is `www.cannaspecific.com`.
2. Set `SENDGRID_FROM_EMAIL` to an address on that domain, such as `hello@www.cannaspecific.com`, **or** authenticate `cannaspecific.com` as well and then send from `hello@cannaspecific.com`.
3. `YOUR_VERIFIED_EMAIL@example.com` will be rejected. The server refuses that placeholder even if it is pasted into the env var.
4. Replies are directed to `NOTIFY_EMAIL`.

Until the from-address is a real sender on the authenticated domain, SendGrid will not deliver. Submissions are still stored. The form tells the person when the confirmation could not be sent. Failures are written to the Render logs and onto the submission row (`email_status`, `email_error`, `notify_status`, `notify_error`).

## Forms and admin

- `POST /api/waitlist` — consumer, dispensary, cultivator, or researcher. Optional company, state, and note.
- `POST /api/partner` — business pilot inquiry. Separate from the waitlist, including when the email is the same.
- Duplicate email within a kind is kept once. A later try retries any email that has not already been sent.
- Honeypot field `companyWebsite` plus an in-memory per-IP rate limit. The rate limit resets when a free Render instance sleeps, which is acceptable for one instance.
- `GET /api/admin/submissions` and `GET /api/admin/submissions.csv` require `ADMIN_TOKEN`.
- Open `/admin`, paste the token, and export CSV from the browser. The token is not put in the query string.
- Older rows in the `interests` table show up in admin as legacy. They were stored, but that form never notified the owner. This deploy does not email those old addresses.

The previous public `GET /api/interests` endpoint has been removed. It returned every submission without a token.

## Local submission test

The automated test uses a local database:

```bash
# example local URL
export DATABASE_URL=postgres://canna:canna@127.0.0.1:5432/cannaspecific
export DATABASE_SSL=disable
npm test
```

`server/submission-flow.test.ts` posts a waitlist signup, reads the row back from Postgres, checks dedupe, invalid email, the honeypot, the partner form, the locked admin list, CSV export, and the rate limit. It unsets `RESEND_API_KEY`, `EMAIL_FROM`, and `SENDGRID_API_KEY` so the test never sends mail, and it asserts the row is still saved with `email_status = skipped`. Resend itself is covered in `server/email.test.ts` with a mocked HTTP client.

## Compliance notes on the copy

The site states that it is for adults 21 and older, that it is not medical advice, and that it does not sell cannabis. The certificate table on the homepage is labeled as an illustrative example with made-up figures. Product tiers are marked coming soon. There are no customer counts, testimonials, or partner logos.
