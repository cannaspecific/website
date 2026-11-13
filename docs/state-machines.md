# State machines

Lifecycles in this repo are a discriminated union on `status` plus a pure reducer in one file. The UI and the route handlers dispatch events. They do not set status strings themselves.

Unhandled events return the same state, so a late response or a double click cannot move the page into a combination that the UI does not handle.

Do not add a state-machine library. Copy this shape:

```ts
type ExampleState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "done" };

type ExampleEvent =
  | { type: "start" }
  | { type: "finish" };

function exampleReducer(state: ExampleState, event: ExampleEvent): ExampleState {
  switch (state.status) {
    case "idle":
      if (event.type === "start") return { status: "pending" };
      return state;
    case "pending":
      if (event.type === "finish") return { status: "done" };
      return state;
    case "done":
      return state;
  }
}
```

Put the reducer next to its types, name the file for the lifecycle, and add a `*.test.ts` that walks every transition, including the events that must be ignored.

## Signup form

`shared/signup-form-machine.ts`, used by `client/src/components/site/forms.tsx`.

| State | What the page shows |
| --- | --- |
| `editing` | The form for `audience` (`individual` or `business`) |
| `submitting` | The same form, with the audience radios and the submit button disabled, labeled "Saving…" |
| `success` | The confirmation for the audience that was posted |
| `error` | The form plus the server message |

| From | Event | To |
| --- | --- | --- |
| `editing` | `submit` | `submitting` |
| `editing` | `selectAudience` | `editing` with that audience |
| `submitting` | `succeed` | `success` |
| `submitting` | `fail` | `error` |
| `error` | `submit` | `submitting` |
| `error` | `selectAudience` to a different audience | `editing` (the server error goes away) |
| `success` | `reset` | `editing` |
| `success` | `selectAudience` | `success` (the confirmation stays; "Submit another response" uses the new audience) |

`selectAudience`, `submit`, and `reset` are ignored while `submitting`, so the fields stay on the request that is in flight. A hash change during that time (`#waitlist` / `#partner`) is applied when `succeed` or `fail` fires. The confirmation copy follows the audience that was posted, which is stored on the result.

`editing` ignores `succeed`, `fail`, and `reset`.

## Admin session

`shared/admin-session-machine.ts`, used by `client/src/pages/admin.tsx`.

The admin token is not part of the machine. It is an input. The machine is the list and the CSV export.

| State | What the page shows |
| --- | --- |
| `idle` | Token field. No list, no empty message |
| `loading` with no rows | "Loading submissions…". View and Export are disabled |
| `loading` with rows | The previous list stays up. View and Export are disabled |
| `ready` | The list, or "No submissions yet." when the list is empty |
| `exporting` | The list stays up. The export button reads "Exporting…" |
| `error` | The message. Rows from a previous success stay on screen. A first-load failure has no rows, which is different from an empty list |

| From | Event | To |
| --- | --- | --- |
| `idle` | `load` | `loading` (no rows) |
| `loading` | `loadSuccess` | `ready` |
| `loading` | `loadFailure` | `error`, keeping whatever rows were already shown |
| `ready` | `load` | `loading`, keeping rows |
| `ready` | `export` | `exporting` |
| `exporting` | `exportSuccess` | `ready` with the same rows |
| `exporting` | `exportFailure` | `error`, keeping rows |
| `error` | `load` | `loading`, keeping rows |
| `error` | `export` | `exporting`, only when a list has been loaded (including an empty one) |

A second `load` or `export` while one is in flight is ignored. `loadSuccess` and `loadFailure` are ignored unless the state is `loading`. `exportSuccess` and `exportFailure` are ignored unless the state is `exporting`.

## Email delivery

`shared/delivery-status.ts`. Each submission has two independent records, `email_status` and `notify_status`. `server/routes.ts` decides whether to send and computes the next record. `server/storage.ts` locks the row and runs `mergeDeliveryUpdate` before writing, so a slower request cannot replace `sent` with a later failure.

| State | Meaning |
| --- | --- |
| `pending` | Saved, not attempted yet |
| `sent` | Delivered. Terminal |
| `failed` | The provider returned an error. A later signup for the same email retries |
| `skipped` | No usable mail provider. A later signup retries |

| From | Event | To |
| --- | --- | --- |
| `pending`, `failed`, `skipped` | attempt `sent` | `sent`, error cleared |
| `pending`, `failed`, `skipped` | attempt `failed` or `skipped` | that outcome, with the attempt's error |
| any except `sent` | not attempted | unchanged, including `pending` |
| `sent` | any attempt, or a proposed write | `sent`, and the stored error stays |

An unknown stored value is read as `pending`, so it can be retried. A proposal of `pending` means "leave the stored record alone".

Legacy interest rows are not in this machine. Admin shows them with a null status because that form never recorded delivery.

Two overlapping requests can both send before either write lands. The lock stops the second write from erasing `sent`. It does not hold the row open while the mail provider is called.

## Already explicit

These are discriminated unions already. Do not wrap them in another reducer.

- Admin access: `ok` \| `disabled` \| `unauthorized` in `server/admin-auth.ts`
- Mail provider selection: `server/email.ts` `MailConfig`
- Rate limit: `ok` or rejected with `retryAfterSec` in `server/rate-limit.ts`
- Toast queue: the reducer in `client/src/hooks/use-toast.ts`

## Not machines

- The mobile nav is one boolean (`open`). Escape and navigation close it. There is no pending or error state.
- `isDbReady()` is one flag written from `initDb` and `closeDb`.
- `POST /api/waitlist` and `POST /api/partner` are a straight sequence of guards (rate limit, validation, honeypot, save, then the delivery machine above). The honeypot still answers with the same success shape as a real signup and stores nothing. That is deliberate.
