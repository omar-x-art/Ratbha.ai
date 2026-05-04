---
name: testing-app
description: How to set up and end-to-end test the Ratbha.ai mobile-first PWA locally — start the dev server, exercise the chat → preview → review → save flow, and use the demo-mode shortcut so the UI is testable without any API keys.
---

# Testing رتّبها AI Calendar locally

## Stack at a glance

- **Framework**: Next.js 14 App Router + TypeScript + Tailwind.
- **Package manager**: pnpm (Corepack enabled).
- **Locale**: Arabic-first (`<html dir="rtl" lang="ar">`).
- **Testing**: Vitest for unit tests; manual computer-use testing for UI.
- **Mobile target**: 480px max width column; verify on iPhone SE (375×667).

## Common commands

```bash
pnpm install --frozen-lockfile   # done automatically by env config
pnpm dev                         # Next.js on http://localhost:3000
pnpm test                        # Vitest unit tests (must be 25/25 green)
pnpm lint                        # ESLint
pnpm typecheck                   # tsc --noEmit
pnpm build                       # production build
```

The dev server logs nothing useful on first paint — always check `/`, `/onboarding`, `/connect-calendar`, `/plan/preview`, `/plan/review`, `/today`, `/inbox`, `/settings` directly.

## End-to-end happy path (no credentials needed)

The fastest way to exercise the entire app without setting up Google/Gemini/Supabase:

1. Open http://localhost:3000/connect-calendar.
2. Click **«ابدأ الوضع التجريبي»** (Start demo mode). This calls `usePlanStore.setPlan(DEMO_PLAN)` and routes to `/plan/preview`.
3. From `/plan/preview` you should see at least 2 day buckets (today + tomorrow) with several tasks.
4. Click **«راجع وعدّل»** to go to `/plan/review`. Click any pencil icon → edit time/duration → tap **«حفظ التعديل»**. The change persists across reloads (Zustand `persist` to localStorage under key `rattabha-plan`).
5. Click **«احفظ في التقويم»** — calls `/api/calendar/save` (stub) and routes to `/today`.
6. On `/today`, the next upcoming task appears. Tap **«تم»** to mark done (removes the item from the store) or **«أجل»** to push it 24h.
7. Open `/inbox` — should show one ambiguous task ("الرد على بريد المورد"). Tap a chip ("اليوم"/"بكرة"/"هذا الأسبوع") to remove it.
8. Open `/settings` — the demo-mode card lets you reload or clear the plan at any time.

## Free-text NLP path

To test the **Gemini fallback** local extractor end-to-end:

1. Open http://localhost:3000/.
2. Type one of these in the composer:
   - `عندي اجتماع 2 والجيم بكرة وأخلص العرض الخميس`
   - `راجع الفواتير لما أفضى وكلم العميل بعد ساعتين`
   - `خطط أسبوعي`
3. The chat shows Siraj typing, then routes to `/plan/preview` with a freshly built plan.
4. The local extractor lives at `src/lib/gemini/local-extractor.ts`. The provider switch (`src/lib/gemini/provider.ts`) automatically uses real Gemini when `GEMINI_API_KEY` is present in `.env.local`.

## Where state lives

- Plan + input text + edits → `usePlanStore` (Zustand, persisted to localStorage as `rattabha-plan`).
- Chat messages → component-local `React.useState` on `/` only (not persisted).
- Toast queue → `useToast()` from `src/components/ui/use-toast.ts`.

To **reset everything** during testing: open DevTools → Application → Local Storage → delete the `rattabha-plan` entry, or use **«أفرغ الخطة الحالية»** in `/settings`.

## Shape of the data

- `Plan` (in `src/lib/types.ts`) has `buckets: DayBucket[]` and `inbox: Task[]`.
- `DayBucket.label` is one of `"today" | "tomorrow" | "later" | "needs_clarification"` plus a free-form `arabicLabel`.
- `PlanItem.item_type` is `"existing_event" | "proposed_task" | "break"`. Existing events are locked (cannot be edited via Bottom Sheet).

## Common gotchas when testing

- **RTL layout**: forward icons (e.g., right-arrow) usually have `rotate-180` to mirror under RTL. If something looks backwards on Chrome's iPhone emulation, check the className.
- **480px column**: pages center via `<AppShellMobile>` — there is *intentional* empty space on desktop. Always test in mobile width.
- **Composer fixed bottom**: `MessageComposer` is `position: fixed`. Ensure the parent uses `<AppShellMobile withComposerSpace>` so content doesn't sit under it.
- **localStorage between sessions**: persistent plan across browser reloads is intentional. Use the demo-clear button or DevTools to wipe it when starting a fresh test.
- **Time-of-day scheduling**: high-energy tasks land before noon, low-energy ones land at 17:00+. If a slot can't accommodate the preference it falls back to first-fit. See `src/lib/schedule/scheduling-engine.ts` `pickPlacement`.

## API stubs (no real services)

| Route | Behavior |
| --- | --- |
| `POST /api/ai/parse-tasks` | Calls `extractTasks` (Gemini if `GEMINI_API_KEY`, else local). |
| `GET /api/calendar/events` | Returns one mock meeting today at 14:00. |
| `POST /api/calendar/save` | Returns `{ ok: true, ids: [...] }` — no real Calendar write. |

## When to deviate

- Don't introduce extra browser tabs or popups during UI testing — RTL layouts often rely on viewport size. Keep one Chrome tab maximized at 375×812 (iPhone X).
- The demo button is the canonical way to test PR #2's pipeline without typing Arabic. Use it for screenshots and recordings.
- Vitest is `environment: "node"` — do not import client-only React modules inside tests.
