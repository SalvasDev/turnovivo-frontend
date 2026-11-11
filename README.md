# TurnoVivo · Frontend

Real-time appointment booking with a smart waitlist, built on the **Ocean Design System** — a token-driven
component library I designed in Figma and implemented from scratch.

> Portfolio MVP. The goal is to show product thinking, a production-grade design system implementation and
> accessible, resilient UI states — not feature breadth.

**Live design system:** `/design-system` (public, no sign-in needed).

## Highlights

- **Design system from Figma to code** — three token tiers (primitive → semantic → component), CSS Modules,
  cascade layers (`ds.atoms < ds.molecules < ds.layouts`) so app styles override the DS predictably.
- **Accessibility built in** — React Aria primitives, visible focus, `forced-colors` support, reduced motion,
  semantic live regions, WCAG AA contrast verified in both themes, automated axe tests and `jsx-a11y` lint.
- **Resilient UI states** — every async action shows a spinner and locks until it settles (no double
  submissions), route-level loading and error boundaries, offline notice when polling fails, empty vs error
  states kept distinct.
- **Light and dark themes** — persisted choice applied before first paint (no flash), `color-scheme` aware.
- **Quality gates in CI** — ESLint, Stylelint token enforcement, type check, 200+ tests, production build.

## Stack

| Layer | Tools |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components), React 19, TypeScript strict |
| UI | React Aria Components, CSS Modules, design tokens as CSS custom properties |
| Testing | Vitest, Testing Library, axe-core |
| Quality | ESLint (Next + jsx-a11y recommended), Stylelint, GitHub Actions |
| Backend (separate repo) | Spring Boot, Spring Security + JWT, PostgreSQL, Redis |

## Design system

```
src/design-system/
├── tokens/        primitives · color aliases · typography · dimensions · effects
│                  semantic-light · semantic-dark · component tokens
├── icons/         typed SVG registry
├── atoms/         Button · Input · Select · Badge · Avatar · Icon · Spinner · Divider
├── molecules/     Card · DatePicker · Table · Toast · ConfirmDialog · FormModal
└── layouts/       AuthLayout
```

Rules the codebase follows (and CI enforces):

- **No raw values outside `tokens/`.** Stylelint rejects hex colors, named colors, `rgb()/hsl()` and `px`.
- **States come from React Aria data attributes** — `[data-hovered]`, `[data-pressed]`, `[data-disabled]`,
  `[data-pending]`, `[data-focus-visible]`.
- **Components expose CSS custom properties as their public styling API** (e.g. `--button-solid`,
  `--button-border-width`) instead of accepting arbitrary class overrides.
- **Async by default.** `Button` accepts an `onPress` that returns a promise; it locks itself and renders an
  accessible progress indicator until the promise settles. `lockOnPress` keeps navigation buttons locked.

```tsx
<Button onPress={() => api.book(slotId)} pendingLabel="Booking">Reserve</Button>
<Button iconOnly aria-label="Appointment actions"><Icon name="moreVertical" /></Button>
```

## Accessibility

- Keyboard support and focus management through React Aria (menus, dialogs, date picker, select).
- Dialogs trap and restore focus; destructive confirmations use `alertdialog`.
- Toasts: errors are `alert`, everything else `status`; polled lists do not spam screen readers.
- Contrast measured in the browser for every button variant and text element in both themes (WCAG AA).
- `prefers-reduced-motion` slows spinners instead of hiding progress; `forced-colors` keeps borders visible.
- Automated: `src/a11y.spec.tsx` runs axe against every component state, open dialogs, auth pages, the booking
  agenda and the admin table.

## Getting started

Requirements: Node.js 20+ and the TurnoVivo backend running on `http://localhost:3000`.

```bash
npm install
npm run dev:3001      # http://localhost:3001
```

Optional `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_BUSINESS_SLUG=barberia-premium
NEXT_PUBLIC_DEFAULT_BUSINESS_NAME="Barberia Premium"
NEXT_PUBLIC_REPOSITORY_URL=https://github.com/<user>/<repo>
```

The design system showcase (`/design-system`) works without the backend.

### Demo accounts

Password for all: `password123`

| Role | Email | What to try |
| --- | --- | --- |
| Client | `cliente.real@turnovivo.com` | Book, join/leave the waitlist, cancel and watch the cascade |
| Admin | `admin@turnovivo.com` | Force-cancel appointments from the operations console |
| Super admin | `super.admin@turnovivo.com` | Create, edit and deactivate companies and admins |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev:3001` | Development server on port 3001 |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit, integration and accessibility tests |
| `npm run lint` | ESLint with the full `jsx-a11y` recommended set |
| `npm run lint:css` | Stylelint token enforcement |
| `npm run typecheck` | TypeScript without emitting |

## Project structure

```
src/
├── app/
│   ├── (main)/          home · [slug] booking · admin · super-admin · design-system
│   │                    shared loading.tsx and error.tsx boundaries
│   └── (auth)/          login · register
├── components/          feature components (agenda, admin, super admin, header, showcase)
├── context/             auth (cookie store), UI (toasts and confirm), theme
├── design-system/       see above
├── services/api.ts      single API layer; ApiError keeps HTTP status
└── a11y.spec.tsx        axe suite
```

## Troubleshooting

- **Network error on login or agenda** — make sure the backend is running on port 3000.
- **"Connection lost" notice** — polling failed; the UI keeps the last known data and retries automatically.
- **Odd session state** — clear the `turnovivo_token` cookie and sign in again.
