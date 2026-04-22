# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

Minimalist personal AI chat client. React 18 + TypeScript + Vite 6. Frontend-only — all persistence is `localStorage`; backend is a separate service reached via `VITE_DOMAIN` + `VITE_API_BASE_URL`.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — typecheck (`tsc -b`) + production build
- `npm run lint` — ESLint

Always run `npm run build` and `npm run lint` before declaring a task done. Both must be clean.

## Architecture

- **`src/App.tsx`** — single top-level component. Composes Rail, main chat area, Palette, SettingsModal. Holds UI state (composer, loading, toast, modal open flags).
- **Hooks in `src/hooks/`** — each owns one `localStorage` key:
  - `useConversations` → `mc-conversations`, `mc-active`
  - `useSettings` → `mc-settings`
  - Rail expanded/collapsed → `mc-rail` (stored inline in App.tsx)
- **`src/services/api.ts`** — thin fetch wrappers. `fetchCompletion(messages, model, provider, signal)` and `fetchImageRecognition(messages, model, provider, signal)` — pass `settings.textModel`/`settings.textProvider` and `settings.imageModel`/`settings.imageProvider` from the UI. All requests include `Authorization: Bearer` from `VITE_ACCESS_TOKEN`.
- **`src/quickActions.ts`** — quick-action registry (id, label, icon, prompt wrapper). Add new actions here and they appear in the hero row, palette, and `⌘1`–`⌘5` hotkeys.

## Design system

Design tokens live in `src/index.css` as CSS custom properties. Dark theme is a `[data-theme='dark']` override on the same variables. **Never hardcode colors in component CSS** — always reference tokens (`var(--bg)`, `var(--ink)`, `var(--accent)`, etc.). Accent-derived surfaces use `color-mix(in srgb, var(--accent) N%, var(--bg))` so they adapt to both theme and user-selected accent automatically.

Theme resolution is centralized in `App.tsx`: a `useEffect` watches `settings.theme` (`light` | `dark` | `system`), resolves `system` via `matchMedia('(prefers-color-scheme: dark)')`, and writes `data-theme` on `<html>`. A second effect sets `--accent` inline on `<html>` from `settings.accent`.

Reference design at `docs/2026-update/design/` — prototype is pixel-accurate, wireframes are context only. Match the prototype when in doubt.

## Conventions

- Markdown rendering path: `marked(content)` → `DOMPurify.sanitize(...)` → `dangerouslySetInnerHTML`. Do not bypass sanitization.
- User text + image messages are stored as two separate `Message` objects (`type: 'text'` and `type: 'image'`) but rendered as one grouped bubble in `src/components/messages/MessageList.tsx` — preserve this grouping if you touch the message render loop.
- Global shortcuts go through `useHotkeys`. Use `mod+` for ⌘/Ctrl. Don't add raw `window.addEventListener('keydown', ...)` in components.
- Icons are individual SVG React components under `src/assets/icons/`. Lucide-style, 1.8px stroke, accept a `size` prop. Add new icons here rather than inlining SVG.
- Prefer editing over creating files. Components are colocated with their CSS (`Foo.tsx` + `Foo.css`).

## Persistence

All `localStorage` writes are best-effort (wrapped in try/catch for quota errors). Key prefix is `mc-`. When adding new persisted state, follow the same pattern: a hook that loads on init, writes on change, and tolerates quota failures silently.

## Backend contract

All requests include `Authorization: Bearer <VITE_ACCESS_TOKEN>`.

```
POST {VITE_DOMAIN}{VITE_API_BASE_URL}/completion
  body: { model: string, provider: string, content: [{ role, content }] }
  returns: { response: string }

POST {VITE_DOMAIN}{VITE_API_BASE_URL}/image-recognition
  body: { model: string, provider: string, messages: [{ role, type, content }] }
  returns: { response: string }

GET {VITE_DOMAIN}{VITE_API_BASE_URL}/providers/openrouter/models
  returns: { data: [{ id, name, context_length, pricing, is_free, supports_images }], fetched_at: number }
```

`model` and `provider` from `useSettings` are passed through unchanged. Preset lists in `MODEL_PRESETS` (`useSettings.ts`) are UI-only — adding a preset does not require a backend change, but the server must recognise the model+provider pair.

## Things not to do

- Don't introduce a state management library. The app is small; local state + a few hooks is enough.
- Don't add a CSS framework. The token system is the design system.
- Don't add backend code here. This repo is frontend-only; the server lives elsewhere.
- Don't add tests without being asked — there is no test setup currently.
