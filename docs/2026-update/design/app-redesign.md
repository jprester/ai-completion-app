# Handoff: master-chat redesign

## Overview

`master-chat` is a personal, single-user chat client for interacting with AI models. This redesign replaces the original toolbar + single-screen layout with a **persistent conversation model**: chats are saved locally, organized in a collapsible sidebar, and navigable via a `⌘K` command palette. Quick actions (Proofread, Summarize, Fact-check, Brainstorm, Describe image) become reusable "prompt primitives" surfaced both as composer chips and as palette entries.

The target experience is Claude.ai–adjacent in polish but stays **personal and lightweight**: no auth, no multi-workspace, no organizations, localStorage-backed history.

---

## About the Design Files

The files in this bundle — `Prototype.html` and `Wireframes.html` — are **design references created in HTML**. They are prototypes that demonstrate intended look and behavior. **They are not production code to copy directly.**

The developer's task is to **recreate this design inside the existing `ai-completion-app` React + Vite + TypeScript codebase**, using its established patterns (React Query, component folder structure, existing `services/api.ts` client, existing Tailwind/CSS approach, etc.). The HTML prototype uses inline styles and CSS variables — these are reference values to translate, not files to import.

---

## Fidelity

**High-fidelity.** `Prototype.html` is pixel-accurate: final colors, typography, spacing, transitions, keyboard shortcuts, and micro-interactions are all intentional and should be matched.

`Wireframes.html` is low-fidelity (sketched) and shows the broader option space explored. It is included for context only — implement from the hi-fi prototype.

---

## Screens / Views

The app is a **single-page layout** with two primary states. There are no routes; everything lives inside one composition.

### Screen A — Empty / New chat state

- **Purpose:** Entry point. User lands here on first load and when clicking "New chat."
- **Layout:**
  - Full-viewport flex row.
  - Left: collapsible **Rail** (52px collapsed, 240px expanded).
  - Right: **Main** column with header, centered hero, composer pinned near the bottom.
- **Hero:**
  - Headline: **"What's on your mind?"** — 34px / 700 / letter-spacing -0.8px, centered.
  - Subhead: **"Pick a quick action, or just type. Press ⌘K for anything."** — 15px, `--muted` color.
  - Quick-action chip row: horizontal flex, gap 8px, wraps on small viewports. Each chip shows icon + label.
- **Composer:** see *Composer* component below. Hint line beneath: *"Your chats are saved locally. Use ⌘K to search, ⌘N for new, ⌘\ to toggle sidebar."*

### Screen B — Active conversation

- **Purpose:** Ongoing chat with the assistant.
- **Layout:** Same shell; hero is replaced by a scrollable `.messages` region. Composer sticks to the bottom.
- **Header:**
  - Left (breadcrumb): folder icon `›` folder name `›` **chat title**.
  - Right: star chip, tag chip (e.g. `# writing`), icon button for palette.
- **Messages:**
  - Max-width 740px, centered.
  - Each message shows an uppercase label (**YOU** in accent, **ASSISTANT** in muted) above the body.
  - Body renders markdown-lite: paragraphs, **bold**, *italic*, `inline code`, ordered + unordered lists.
  - Hover on assistant message reveals a row of quiet actions (copy, save).
  - If the message has an image (user uploads), it renders above the body at max-width 320px, `--radius`, bordered.

---

## Components

### Rail (`components/rail/Rail.tsx`)

Collapsible left navigation. Two states controlled by a single boolean:

| State | Width | Shows |
|---|---|---|
| Collapsed | 52px | Hamburger toggle, "+" (new chat), search icon |
| Expanded | 240px | All of the above with labels + shortcut hints, section headers ("Today", "Earlier"), conversation list, "Pinned prompts" footer button |

- **Background:** `--bg-alt` (`#f3f1ec`)
- **Border-right:** `1px solid --faint`
- **Transition:** `width 180ms cubic-bezier(.3,.7,.3,1)`. Labels fade in/out independently (opacity 0 → 1, 150ms, 50ms delay) so text doesn't "stretch" during the width tween.
- **Top row:** 48px min-height, hamburger toggle + brand mark.
- **Toggle button:** 36×36, hover bg `--faint`. `aria-label` switches between "Collapse sidebar" / "Expand sidebar".
- **Nav buttons:** 8px 10px padding, radius 8px, gap 10px, hover bg `--faint`. Primary action (`New chat`) uses `--accent` color.
- **Conversation rows:**
  - 7px 10px padding, radius 8px, hover bg `--faint`.
  - Active row: bg `--accent-bg`, color `--accent`.
  - Title truncates with ellipsis; date right-aligned in `--muted` 11px (only shown for non-Today rows).
- **Mobile:** Under 720px viewport, expanded rail becomes an **overlay drawer** (absolute, full height, `box-shadow: --shadow-lg`) instead of pushing the main content.
- **Persistence:** rail expanded/collapsed state is saved to `localStorage` key `mc-rail` with values `"expanded"` | `"collapsed"`.

### Command palette (`components/palette/Palette.tsx`)

Triggered by `⌘K` / `Ctrl+K` or the search affordances. Modal overlay.

- **Backdrop:** full-viewport `rgba(31,29,26,0.28)` with `backdrop-filter: blur(4px)`. Click dismisses.
- **Card:** max-width 580px, bg `--surface`, radius 12px, `--shadow-lg`. Entry animation: translateY(-8px → 0) + opacity 0 → 1 over 150ms.
- **Structure:**
  1. Input row (14px 18px padding, bottom border `--faint`): search icon, input (16px), `esc` kbd.
  2. Results list (max-height 52vh, scrollable):
     - Group heading "Quick actions" → 5 quick-action prompts with `⌘1`–`⌘5` hints.
     - Group heading "Recent chats" → up to 6 filtered conversations.
     - Empty state: centered muted text "No matches."
  3. Footer bar (`--bg-alt`, top border `--faint`): `↑↓ navigate ↵ run` on left, result count on right.
- **Keyboard:** `↑`/`↓` move selection, `Enter` runs, `Escape` closes. Hover syncs selection index.
- **Behavior on run:**
  - Prompt item → seeds composer with that action's prompt prefix (see *Quick actions*).
  - Chat item → selects that conversation.

### Composer (`components/composer/Composer.tsx`)

- **Shell:** max-width 740px, bg `--surface`, border `1px solid --faint`, radius 12px, padding 4px, `--shadow-sm`. On focus-within: border `--muted`, `--shadow-md`.
- **Textarea:** auto-resizing (min 1 row, max 240px). No border/outline. 15px, line-height 1.5. Transparent bg.
- **Action pills** (above textarea when present):
  - **Active action pill:** `--accent-bg` background, `--accent` text, icon + label + × dismiss.
  - **Attached image pill:** same structure, shows file name.
- **Bottom row:**
  - Image upload icon-button (opens hidden file input, accepts image/*).
  - Spacer.
  - Hint text: *"↵ send · ⇧↵ newline"* (11px, `--muted`).
  - Send button: 32×32, radius 8px, bg `--ink`, icon color `--bg`. Hover bg flips to `--accent`. Disabled when input is empty and no image: bg `--faint`, color `--muted`.
- **Keybinds in composer:**
  - `Enter` → send (unless `Shift` held).
  - `Backspace` with empty input + active action → clear the action pill.

### Quick actions (prompt primitives)

Defined as an array of `{ id, label, prompt, icon, kbd }`. Five seed entries:

| id | label | prompt prefix | icon | kbd |
|---|---|---|---|---|
| `proofread` | Proofread | "Please proofread and fix spelling, grammar and style of the following text:\n\n" | pen | ⌘1 |
| `summarize` | Summarize | "Please summarize the following text:\n\n" | book | ⌘2 |
| `factcheck` | Fact-check | "Please fact-check the following claim and cite whether it is accurate, inaccurate, or requires more context:\n\n" | check | ⌘3 |
| `brainstorm` | Brainstorm | "Brainstorm 10 ideas for:\n\n" | bolt | ⌘4 |
| `describe-img` | Describe image | (no prompt; opens file picker) | image | ⌘5 |

Selecting an action inserts a pill above the textarea and focuses it. On send, the prompt prefix is prepended to the user's text before the API call.

### Message bubble

Two variants by role:

- **User:** label "YOU" in `--accent`. Optional image at top. Body text.
- **Assistant:** label "ASSISTANT" in `--muted`. Body. Row of action buttons below (hidden until hover, opacity 0 → 1 over 150ms): **copy**, **save**.

Markdown rendered safely — escape then inline-transform only: `` ` `` → code, `**` → strong, `*` → em. Block-level: ordered list (`^\d+\.`), unordered list (`^[-*]`), paragraphs. Do **not** use a full markdown library for the MVP; the simple renderer in the prototype is sufficient.

---

## Interactions & Behavior

### Global keyboard shortcuts

Install once on `window` at the App level.

| Combo | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Toggle palette |
| `⌘N` / `Ctrl+N` | New chat (also clears active convo, focuses textarea) |
| `⌘\` / `Ctrl+\` | Toggle rail |
| `⌘1`–`⌘5` | Apply corresponding quick action |
| `Esc` | Close palette |

### Flows

1. **New chat → first send:** If no active conversation, sending creates a new one. Title auto-generates from the first user message (first 34 chars + ellipsis if longer, or falls back to the action label).
2. **Select chat from rail:** loads messages, keeps rail state, clears any staged action/image.
3. **Quick action from palette:** closes palette, seeds composer with action pill, focuses textarea.
4. **Image upload:** FileReader → data URL. Preview pill in composer; sent as `userMessage.image`.
5. **Simulated reply (prototype only):** 700ms delay, then canned response. **In production**, replace with `fetchCompletion` / `fetchImageRecognition` from `services/api.ts`.

### Animations & transitions

- Rail width: `180ms cubic-bezier(.3,.7,.3,1)`.
- Rail labels opacity: `150ms`, `50ms` delay.
- Palette backdrop fade: `120ms`.
- Palette card pop: `150ms cubic-bezier(.3,.7,.3,1)`.
- Message actions opacity: `150ms`.
- Chip/button color transitions: `120ms`.
- Toast fade in: `200ms`, auto-dismiss after 1600ms.

### Loading & error states (not in prototype — implement for production)

- **Sending:** disable send button, show a minimal "Assistant is thinking…" placeholder message with a pulsing dot (use `--muted`).
- **Error:** inline error bubble in assistant slot with a retry link.
- **Offline:** toast "You're offline — sends will queue."

### Responsive behavior

| Breakpoint | Change |
|---|---|
| `> 720px` | Rail pushes main content. Default. |
| `≤ 720px` | Rail collapses to 44px. Expanded rail becomes overlay drawer. Headers and composer padding drop from 24px to 16px. Hero headline drops to 28px. |

---

## State Management

Keep it simple — the app is single-user with no server sync.

```ts
type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // data URL
  createdAt: number;
};

type Conversation = {
  id: string;
  title: string;
  date: string; // display string, e.g. "Today" | "Yesterday" | "Apr 18"
  messages: Message[];
  pinned?: boolean;
  tags?: string[];
};

type AppState = {
  conversations: Conversation[];
  activeId: string | null;
  railExpanded: boolean;
  input: string;
  activeAction: QuickAction | null;
  stagedImage: { name: string; dataUrl: string } | null;
  paletteOpen: boolean;
};
```

- **Source of truth:** React `useState` in `App.tsx` for MVP; migrate to a Zustand store if it grows.
- **Persistence:** `localStorage` keys:
  - `mc-conversations` → JSON array of conversations (on every mutation, debounced 300ms).
  - `mc-rail` → `"expanded"` | `"collapsed"`.
  - `mc-active` → active conversation id.
- **API integration:** replace the prototype's `simulateReply()` with the existing `fetchCompletion` / `fetchImageRecognition`. Use React Query mutations so you get retry + loading state for free.

---

## Design Tokens

Translate these into Tailwind config, CSS variables, or a `tokens.ts` module — whichever the codebase already uses.

### Colors

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#fbfaf7` | App background |
| `--bg-alt` | `#f3f1ec` | Rail background, palette footer, code bg |
| `--surface` | `#ffffff` | Composer, palette card, chips |
| `--ink` | `#1f1d1a` | Primary text, send button |
| `--ink-soft` | `#3a3731` | Secondary text on chips/buttons |
| `--muted` | `#8a847b` | Tertiary text, icon default |
| `--faint` | `#e6e2d9` | Borders, dividers, scrollbar |
| `--accent` | `#c96442` | Accent (primary action, active row, user label) |
| `--accent-soft` | `#f3c9b8` | (unused in prototype; reserved for focus rings) |
| `--accent-bg` | `#fdf2ec` | Active row / accent pill background |
| `--yellow` | `#f5dd5c` | (reserved; not currently used) |

Accent is **user-configurable** via the in-prototype Tweaks panel. Options shown: brick `#c96442`, ink `#1f1d1a`, olive `#6a7a3a`, blue `#4a6fa5`, plum `#7a3a6a`. Make accent a settings-stored preference in production.

### Typography

- **Body:** `Inter`, weights 400/500/600/700. Fallback: `system-ui, -apple-system, sans-serif`.
- **Mono:** `JetBrains Mono`, weights 400/500. Fallback: `ui-monospace, monospace`.
- **Base size:** 14px. Line-height 1.5.
- **Hero headline:** 34px / 700 / letter-spacing -0.8px (28px on mobile).
- **Message body:** 15px / line-height 1.65.
- **Crumb / chips / rail rows:** 13px / 500.
- **Section labels (rail, palette groups):** 10px / 600 / uppercase / letter-spacing 0.8px / color `--muted`.
- **Kbd:** 11px mono, 1px 6px padding, radius 4px, border 1px `--faint`, bg `--surface`, color `--muted`, `box-shadow: 0 1px 0 --faint`.

### Spacing

No rigid scale — the prototype uses 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 40 px across the layout. If the codebase has a Tailwind spacing scale, map these to the nearest step.

### Radii

| Token | Value | Use |
|---|---|---|
| small | `4px` | kbd, code |
| `--radius` | `8px` | Buttons, nav items, rows, icon buttons |
| `--radius-lg` | `12px` | Composer, palette card |
| pill | `999px` | Chips |

### Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(31,29,26,0.04)` |
| `--shadow-md` | `0 4px 12px rgba(31,29,26,0.08), 0 1px 2px rgba(31,29,26,0.04)` |
| `--shadow-lg` | `0 16px 48px rgba(31,29,26,0.18), 0 2px 8px rgba(31,29,26,0.08)` |

---

## Assets

No bundled image or icon assets — all icons are inline SVG generated by a small `<Icon name="..." />` helper in the prototype. The set used:

`menu, plus, search, star, folder, send, image, sparkle, pen, clock, x, check, copy, book, bolt, tag, more`

In production, replace with your existing icon system (Lucide / Heroicons / etc.) — the visual weight should match: 1.8px stroke, round line caps and joins, 16px default size.

Fonts load from Google Fonts in the prototype. In production, self-host or use whatever font pipeline the project already has.

---

## Files in this handoff

- `README.md` — this document.
- `Prototype.html` — the hi-fi reference. Open directly in a browser.
- `Wireframes.html` — earlier low-fi exploration (multiple directions + sidebar-reveal variants). Context only.

## Implementation order (recommended)

1. Add design tokens to Tailwind/CSS config.
2. Build `Rail` (static), wire localStorage persistence.
3. Build `Composer` with auto-resize + action pill + image pill.
4. Wire a single `conversations` state in `App.tsx`, empty + active states.
5. Add global keyboard shortcuts hook.
6. Build `Palette` — prompts section only, then chat search.
7. Replace `simulateReply` with the real API client.
8. Mobile polish (overlay drawer, padding reductions).
9. Pinned prompts, tags, folders — nice-to-haves deferred beyond MVP.
