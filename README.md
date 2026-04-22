# master-chat

A minimalist personal AI chat client built with React + TypeScript + Vite. Connects to a backend that proxies Mistral / OpenAI / Anthropic models for text completion and image recognition.

## Features

- **Conversations** — multiple chats persisted to `localStorage`, pinning, auto-titling, delete
- **Collapsible rail** — sidebar with chat list, pinned section, recents
- **Command palette** — `⌘K` for fuzzy search across chats and quick actions
- **Quick actions** — proofread, summarize, fact-check, brainstorm, image recognition (`⌘1`–`⌘5`)
- **Image upload** — drop an image into the composer, ask about it via the vision model
- **Markdown rendering** — messages rendered with `marked`, sanitized with `DOMPurify`
- **Dark / light / system theme** — toggle in header, full preference in Settings
- **Settings modal** — theme, accent color, text model, image model, clear data, reset prefs
- **Keyboard shortcuts** — `⌘K` palette · `⌘N` new chat · `⌘\` toggle rail · `⌘1`–`⌘5` quick actions · `Enter` send · `⇧Enter` newline
- **Mock mode** — toggle in dev to skip the network and load a canned response

## Stack

- React 18 · TypeScript · Vite 6
- `marked` + `DOMPurify` for markdown
- CSS custom properties (design tokens) with `[data-theme='dark']` switching
- `localStorage` for all persistence (conversations, settings, rail state)

## How to run

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run build
npm run lint
```

## Environment

Create `.env.local` with:

```
VITE_DOMAIN=http://localhost:8000
VITE_API_BASE_URL=/api
VITE_ACCESS_TOKEN=shared-token        # must match ACCESS_TOKEN on the backend; NOT a real secret (bundled into client)
VITE_MAX_CHATS=20                     # optional, per-conversation message cap
VITE_ENV=development                  # hides the Mock toggle when set to "production"
```

The app calls `POST /completion`, `POST /image-recognition`, and `GET /providers/openrouter/models` on the backend. Every request includes `Authorization: Bearer <VITE_ACCESS_TOKEN>`. See `src/services/api.ts` for the full request shapes.

> **Note on `VITE_ACCESS_TOKEN`:** all `VITE_*` env vars are baked into the production bundle and readable by anyone who loads the site. Treat this token as a shared/rotatable lightweight gate against anonymous drive-by traffic on the backend URL, not as a real secret. Rotate it by updating both `ACCESS_TOKEN` (Railway) and `VITE_ACCESS_TOKEN` (Netlify) together.

## Project layout

```
src/
  App.tsx              # top-level composition
  index.css            # design tokens + light/dark themes
  quickActions.ts      # quick-action prompts and metadata
  assets/icons/        # SVG icon components
  components/
    palette/           # ⌘K command palette
    rail/              # collapsible sidebar
    settings/          # settings modal
    spinner/           # loading indicator
    tooltip/           # hover tooltip
  hooks/
    useConversations.ts  # chat list + active chat, persisted
    useHotkeys.ts        # global keyboard shortcuts
    useSettings.ts       # theme, accent, model prefs, persisted
  services/
    api.ts             # backend fetch helpers
docs/
  2026-update/         # design spec, prototype, wireframes for 2026 rewrite
```

## Author

Janko Prester — janko.prester@gmail.com
