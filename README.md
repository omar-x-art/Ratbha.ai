# رتّبها AI Calendar — مخطط يومي ذكي متصل بالتقويم

> اكتب اللي في دماغك… وسنرتّبه داخل تقويمك.

تطبيق ويب Mobile-First، عربي أولاً، قابل للتثبيت كـ PWA. الواجهة بسيطة جداً تشبه الدردشة، والمنطق الذكي (استخراج المهام، فهم التواريخ، حساب الفراغات، منع التعارض، الترحيل) يعمل في الخلفية.

## Stack
- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS + shadcn-style components** (custom build, lightweight)
- **vaul** for the bottom-sheet
- **IBM Plex Sans Arabic** (via `next/font`) — Arabic-first
- **Vitest** for unit tests on the date resolver and scheduling engine
- **Supabase Postgres** (migrations in `supabase/migrations/`)
- **Google OAuth + Google Calendar API** *(stubbed routes; integration in Phase 5)*
- **Gemini API** *(stubbed; live integration in Phase 5)*
- **PWA** via `manifest.webmanifest`

## Getting started

```bash
pnpm install        # or npm install
pnpm dev            # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm test
```

The first PR ships the **mobile-first UI with mock data** — you do **not** need any API keys to run it. The Phase 5 integration will wire Supabase, Google OAuth, Calendar API and Gemini.

## Screens (MVP)
| Route | Screen |
| --- | --- |
| `/onboarding` | Welcome with Siraj |
| `/connect-calendar` | Connect Google Calendar (read-first) |
| `/` | Chat Home |
| `/plan/preview` | Proposed plan (cards by day) |
| `/plan/review` | Review & edit (timeline + bottom sheet) |
| `/today` | Next task widget |
| `/inbox` | Tasks needing clarification |
| `/settings` | Minimal settings |

## Characters
- **سراج** — the green rabbit assistant (default).
- **عمر** — Siraj's father; appears as a mentor for *"اقترحت لك هذه الخطة لأن…"* moments.

Character images live in `public/characters/` and are surfaced through `<CharacterAvatar />` with five emotional states: `neutral | happy | thinking | encouraging | explaining`.

## Layout principle
- **Mobile-first.** Everything renders inside a 480px max-width column even on desktop.
- **RTL** is hard-coded on `<html dir="rtl" lang="ar">`.
- The Composer is fixed to the bottom and always shows a small "لن نحفظ شيء قبل مراجعتك" reassurance line.
- We **never** save to the user's Google Calendar without a confirmed press of **«احفظ في التقويم»**.

## Folder structure
```
src/
  app/                 # routes (App Router)
    api/               # backend stubs returning mock data
  components/
    shell/             # AppShellMobile, TopBar
    chat/              # ChatThread, ChatBubble, SuggestionChips, MessageComposer, …
    characters/        # CharacterAvatar (Siraj/Omar)
    plan/              # PlanSummaryCard, DaySection, TaskItem, BottomSheetEditTask, NextTaskWidget, InboxCard
    system/            # OnboardingHero, CalendarPermissionCard
    ui/                # primitives (Button, Card, Sheet, Toast, Avatar, Separator, Input)
  lib/
    date/              # arabic-date-resolver + tests
    schedule/          # scheduling-engine + tests
    gemini/            # zod schema for Gemini JSON output
    supabase/          # schema.sql, placeholder client
    mock/              # fixtures
public/
  characters/          # Siraj + Omar PNGs
  icons/               # PWA icons
  manifest.webmanifest
```

## Roadmap (per the project plan)
- **Phase 0–2** *(this PR)* — scaffold, design tokens, components, all 8 screens with mock data.
- **Phase 3** — wire stubbed API routes to real fixtures and integrate the date resolver / scheduling engine in the UI.
- **Phase 4** — Supabase schema deploy + RLS, Google OAuth, Calendar read.
- **Phase 5** — Gemini live extraction, save-to-calendar flow, FCM notifications.
- **Phase 6** — QA polish, Vercel deployment, custom domain.

## Tests
```bash
pnpm test
```
Covers:
- Arabic date resolution (`اليوم / بكرة / الخميس / الأسبوع القادم / لما أفضى`)
- Free-slot computation (with post-meeting buffer)
- Scheduling without conflicts
