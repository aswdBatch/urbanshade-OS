

# Phase 2+3 Fix & Documentation Overhaul Plan

## Current State Assessment

The tech-debt plan marks Phases 2-9 as complete, but **none of the actual code changes were made**. The infrastructure was created (types/window.ts, appRegistry.tsx, useModerationGates.ts) but never wired in:

- Desktop.tsx: Still 1110 lines, still has 800-line inline `allApps` array, still exports `App` interface, still has dead VIP code/dialog
- WindowManager.tsx: Still has duplicate `WindowData` (lines 65+84), stray import on line 90, imports `App` from Desktop
- Taskbar.tsx, TaskView.tsx, AltTabSwitcher.tsx, GlobalSearch.tsx, DesktopIcon.tsx, StartMenu.tsx, useKeyboardShortcuts.ts: All still import `App` from Desktop instead of types/window.ts

---

## Part A: Fix Phase 2 — Desktop.tsx Cleanup

### A1. Wire up appRegistry.tsx
- Remove the 570-line `allApps` array (lines 244-816) from Desktop.tsx
- Import `createAppRegistry` from `@/lib/appRegistry`
- Call `const allApps = useMemo(() => createAppRegistry(openAppById), [openAppById])`
- Remove the `allAppsRef` hack (line 242, line 819)
- Remove the massive lucide icon import block (line 22) — only keep icons still used in Desktop.tsx itself (Shield, Star, Sparkles, Download)

### A2. Use shared types
- Remove the `export interface App` block (lines 29-38) from Desktop.tsx
- Import `App, WindowData` from `@/types/window`
- Update all 6 consumer files to import from `@/types/window` instead of `./Desktop`:
  - WindowManager.tsx, Taskbar.tsx, TaskView.tsx, DesktopIcon.tsx, GlobalSearch.tsx, StartMenu.tsx

### A3. Remove dead VIP code
- Remove `showVipWelcome` state (line 68)
- Remove `checkVipStatus` useEffect (lines 101-119)
- Remove VIP Welcome Dialog JSX (lines 1051-1107)
- Remove unused `useSearchParams` import (line 25)
- Remove unused `Dialog/DialogContent/DialogDescription/DialogFooter/DialogHeader` imports (line 26)
- Remove unused `Button` import (line 27)

---

## Part B: Fix Phase 3 — WindowManager.tsx Cleanup

### B1. Remove duplicate interface & stray import
- Remove duplicate `WindowData` (lines 84-88)
- Move `UrbanshadeInstaller` import (line 90) to top with other imports
- Import `App, WindowData` from `@/types/window` instead of `App` from `./Desktop`

### B2. Fix AltTabSwitcher.tsx & useKeyboardShortcuts.ts
- AltTabSwitcher: Remove local `WindowData`, import from `@/types/window`
- useKeyboardShortcuts: Remove local `WindowData`, import `App, WindowData` from `@/types/window`, replace `any` on lines 16-17

---

## Part C: INSANE Documentation Overhaul Plan — Save & Execute

Save a new `docs-overhaul-plan.md` with the following phases:

### Phase 0: Save the Plan
Save to `docs-overhaul-plan.md`.

### Phase 1: Docs Hub (Docs.tsx) — Visual Upgrade
- Add animated gradient hero with particle/scanline effect
- Add "What's New" banner linking to latest changelog/features
- Add category tabs/pills for filtering (Guide, Apps, Terminal, Developer, Staff, Safety)
- Add article read-time estimates
- Add "Popular" badges on high-traffic articles
- Improve mobile layout (single column, larger touch targets)
- Add keyboard shortcut hint (/) next to search bar

### Phase 2: Getting Started — Interactive Onboarding
- Add animated installation type comparison table with checkmarks
- Add "Try it now" CTA buttons that link back to the OS with `?open=` params
- Add a visual boot sequence diagram (ASCII art or styled steps)
- Add OOBE walkthrough screenshots/mockups as styled placeholder cards
- Add estimated setup times per install type

### Phase 3: Terminal Guide — Command Reference Upgrade
- Add copy-to-clipboard buttons on all code blocks
- Add a "Try in Terminal" button that opens OS with terminal via `?open=terminal`
- Add command categories with collapsible sections
- Add syntax highlighting for command arguments
- Add "Related Commands" links at the bottom of each section
- Add a searchable command index at the top

### Phase 4: Applications — Complete App Catalog
- Add a full app count (currently only lists ~12 of 70+ apps)
- Add "Downloadable" vs "Built-in" badges
- Add app screenshots/mockups as styled placeholder cards
- Add "Open this app" links using `?open=` params
- Group into: Productivity, System, Media, Communication, Games, Facility, Security, Science

### Phase 5: Keyboard Shortcuts — Interactive Reference
- Add "Press to try" interactive demo hints
- Add printable/downloadable shortcut cheat sheet (styled card)
- Add context-aware grouping with visual section dividers
- Add shortcut search/filter

### Phase 6: Troubleshooting — Diagnostic Wizard
- Add interactive "What's wrong?" decision tree
- Add expandable FAQ with smooth animations
- Add "Still stuck?" CTA linking to /support
- Add error code reference table
- Add system diagnostics tips section

### Phase 7: Advanced Features — Deep Dive
- Add BIOS settings reference table
- Add Recovery Mode step-by-step with visual guide
- Add Safe Mode feature comparison table
- Add crash type reference (all bugcheck codes)

### Phase 8: Safety & Moderation Docs — Polish
- Add badge visual gallery with actual badge icons
- Add reporting flow diagram
- Add moderation action severity scale visual
- Add "How we protect you" timeline/infographic

### Phase 9: Version Bump & Plan Closeout
- Bump to v3.7.0 "Documented"
- Update HTML title, version.json
- Add changelog entry for docs overhaul
- Update tech-debt-plan.md phase 2+3 as truly complete
- Mark docs-overhaul-plan.md phases as complete

---

## Files Changed

**Part A+B (Tech Debt):**
- `src/components/Desktop.tsx` — Major reduction (~500 lines removed)
- `src/components/WindowManager.tsx` — Cleanup duplicates
- `src/components/Taskbar.tsx` — Fix import source
- `src/components/TaskView.tsx` — Fix import source
- `src/components/AltTabSwitcher.tsx` — Fix import source
- `src/components/DesktopIcon.tsx` — Fix import source
- `src/components/GlobalSearch.tsx` — Fix import source
- `src/components/StartMenu.tsx` — Fix import source
- `src/hooks/useKeyboardShortcuts.ts` — Fix types
- `tech-debt-plan.md` — Update status accurately

**Part C (Docs Plan):**
- `docs-overhaul-plan.md` — New file (the plan)

Implementation order: Part A → Part B → Part C (save plan only, implementation follows in subsequent messages)

