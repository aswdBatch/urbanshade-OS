

# Plan: Developer Documentation Overhaul

## Problem

The dev docs are largely fictional. They describe APIs that don't exist and omit the ones that do:

- **Apps page** says register in "Desktop.tsx appDefinitions" -- wrong. The real system uses `appRegistry.tsx` (a factory function `createAppRegistry`) + a switch in `WindowManager.tsx`.
- **SystemBus page** documents `subscribe("window:open", ...)` with events like `window:open`, `theme:change`, `user:login` -- none of these exist. The real SystemBus is a class with typed `SystemEventType` enums (`TRIGGER_CRASH`, `TRIGGER_BUGCHECK`, `TRIGGER_LOCKDOWN`, etc.) and methods `on()`, `emit()`, `onAny()`, plus convenience methods like `triggerCrash()`, `triggerReboot()`.
- **Terminal page** shows a fake `customCommands` export object. The real `terminalScripts.ts` is a script runner (save/load/run multi-command scripts), not a command registration system.
- **Architecture** is surface-level. Lists tech stack and a basic tree but doesn't explain the actual boot flow, window lifecycle, or hook architecture.
- **Contributing** links to `https://github.com` (generic).
- **Index** still shows a "Work in Progress" banner.

## Scope

Rewrite all 7 dev doc pages to accurately reflect the real codebase. No new routes needed -- same pages, correct content.

---

## Phase 1: Index Page Refresh

**File:** `src/pages/docs/dev/Index.tsx`

- Remove the "Work in Progress" alert
- Add a "Tech Stack at a Glance" row (React 18, TypeScript, Vite, Tailwind, Supabase, shadcn/ui) with version badges
- Add a "Key Files" quick-reference card listing `appRegistry.tsx`, `systemBus.ts`, `WindowManager.tsx`, `terminalScripts.ts`, `persistence.ts`
- Keep the existing section links grid

## Phase 2: Architecture -- Real Content

**File:** `src/pages/docs/dev/Architecture.tsx`

- **Component Tree**: Expand to show the real flow: `App.tsx` -> boot sequence states -> `Desktop` + `WindowManager` + `Taskbar` + `StartMenu` + `NotificationCenter` + widgets
- **State Management**: Document the actual patterns: `useState` in `Index.tsx` (the god component), localStorage via `persistence.ts`, React Query for Supabase, `systemBus` for cross-component events
- **Hook Architecture**: List the real hooks by category (System: `useBootSequence`, `useSystemSettings`, `useBugcheck`; Social: `useFriends`, `useMessages`, `useGlobalChat`; Economy: `useKroner`, `useShop`, `useBattlePass`; etc.)
- **Window Lifecycle**: Explain `WindowData` type, how `openWindow`/`closeWindow` work, z-index management
- **File System**: Mention `useVirtualFileSystem` and the virtual FS model

## Phase 3: Building Apps -- Accurate Registration

**File:** `src/pages/docs/dev/Apps.tsx`

- Fix Step 1: Create component in `src/components/apps/`
- Fix Step 2: Register in `src/lib/appRegistry.tsx` -- show the real `App` interface (`id`, `name`, `icon`, `run`, `downloadable`, `minimalInclude`, `standardInclude`, `searchAliases`)
- Fix Step 3: Add switch case in `src/components/WindowManager.tsx`
- Show real code from appRegistry (not fabricated examples)
- Add section on `downloadable` vs `minimalInclude` vs `standardInclude` flags
- Add section on window props apps receive

## Phase 4: SystemBus -- Real API

**File:** `src/pages/docs/dev/SystemBus.tsx`

- Replace the entirely fake event table with real `SystemEventType` values: `TRIGGER_CRASH`, `TRIGGER_BUGCHECK`, `TRIGGER_LOCKDOWN`, `ENTER_RECOVERY`, `TRIGGER_REBOOT`, `TRIGGER_SHUTDOWN`, `OPEN_DEV_MODE`, `CLOSE_ADMIN_PANEL`, `CUSTOM_COMMAND`
- Document the real class methods: `on(type, callback)`, `onAny(callback)`, `emit(type, payload?)`
- Document convenience methods: `triggerCrash()`, `triggerBugcheck()`, `triggerLockdown()`, `enterRecovery()`, `triggerReboot()`, `triggerShutdown()`, `openDevMode()`, `closeAdminPanel()`
- Show the real `SystemEvent` interface (`type`, `payload`, `timestamp`)
- Note that events also dispatch as DOM CustomEvents (`systembus-event`)
- Note the global debug access: `window.systemBus`

## Phase 5: Terminal Commands -- Accurate

**File:** `src/pages/docs/dev/Terminal.tsx`

- Keep the built-in command reference (those are fine)
- Replace the fake "Creating Custom Commands" section with the real **Terminal Scripts** system from `terminalScripts.ts`: save/load/run multi-command scripts, the `TerminalScript` interface
- Document the real script management functions: `getScripts()`, `saveScript()`, `updateScript()`, `deleteScript()`, `recordScriptRun()`

## Phase 6: Theming, UUR, Contributing -- Polish

**Files:** `Theming.tsx`, `UUR.tsx`, `Contributing.tsx`

- **Theming**: Add mention of `useThemeEngine` hook and `useThemePresets`, the theme editor app. Reference the real CSS variable list from `index.css` more accurately.
- **UUR**: This is mostly aspirational/simulation content -- keep but add a note that UUR is an in-simulation feature.
- **Contributing**: Replace the generic `https://github.com` link. Add the version bump checklist (update `version.json`, `index.html` title, changelog). Reference the real project structure with accurate directory descriptions.

## Phase 7: Static HTML + Plan Closeout

- Update `public/static/dev.html` to match the corrected content
- Mark this as a sub-task of tech-debt-2 Phase 5 (Developer Onboarding)
- No version bump in this step (that's Phase 6 of tech-debt-2)

