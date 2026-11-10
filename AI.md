# AI Global Context & Rules - Appointment App

## Project Overview
A compact appointment-booking Next.js app with 5 views:
1. Home (Landing/Entries)
2. Auth (Sign In / Sign Up)
3. Slots Booking (Header, DatePicker, Time slots grid, Footer)
4. Admin Slots (Force cancel slots)
5. Admin Companies (CRUD for tenant companies)

## Core Stack & Architecture
- Framework: Next.js (App Router)
- UI Library: React Aria Components
- Styling: CSS Modules exclusively
- State & Providers: Global Providers initialized in `src/app/providers.tsx`

## Strict UI & Token Rules
- NO hardcoded hex colors, pixels, or paddings.
- All styles must use CSS variables from `src/design-system/tokens/`.
- Folder structure for UI components:
  * `src/design-system/atoms/` (Button, Text, Badge, Icon)
  * `src/design-system/molecules/` (AppointmentCard, InputField, DatePicker)
- React Aria States: Use native data-attributes in CSS (`[data-hovered]`, `[data-pressed]`, `[data-disabled]`).

## Development Code Conventions
- Use TypeScript with strict type definitions.
- Components must be functional components with clean prop interfaces.
- Do not modify existing business logic or API fetchers unless explicitly requested.
- Keep components modular following Atomic Design guidelines.
