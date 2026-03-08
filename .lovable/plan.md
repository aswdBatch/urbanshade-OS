

# Plan: Main OS + DEF-DEV Improvement Sweep

## Current Problems

### Main OS (Index.tsx — 1082 lines)
- **God component**: Index.tsx has ~40 useState calls, ~10 useEffect blocks, and all screen-rendering logic inline. `useBootSequence.ts` exists (609 lines) but Index.tsx still duplicates most of its logic instead of using it.
- **No state machine**: Boot flow is a cascade of boolean flags (`postComplete`, `biosComplete`, `booted`, `loggedIn`, `crashed`, etc.) checked in sequence. Hard to reason about, easy to break.
- **`(window as any)`**: Multiple global commands (`adminPanel()`, `maintenanceMode()`, etc.) exposed with untyped casts.
- **Inline site-lock UI**: The site-locked screen is 20 lines of raw JSX inside Index.tsx instead of a component.

### DEF-DEV
- **Header says "DEF-DEV 3.0"** — should be updated to match current version context.
- **DefDevMain.tsx duplicates useDefDevState**: The hook exists with all the same state, but DefDevMain re-declares everything manually instead of using it.
- **FloatingDefDev duplicates console capture**: Copy-pasted console interception logic from DefDevMain.
- **No keyboard shortcuts in DEF-DEV**: No way to quickly switch tabs, clear console, etc.
- **Missing tabs in sidebar**: Components, Boot Analyzer, Crash Analyzer, Memory Profiler, Mods, Supabase tabs are imported and rendered but NOT listed in DefDevTabs sidebar groups — unreachable via UI.
- **No status bar**: No persistent footer showing log count, memory usage, or session uptime.

---

## Phase 1: Extract Index.tsx State Machine

**Goal**: Reduce Index.tsx from 1082 lines to ~300 by extracting a proper state machine.

- Create `src/hooks/useSystemStateMachine.ts` with a single `systemState` enum: `DISCLAIMER | INSTALLATION | BAN_CHECK | LOCKOUT | SITE_LOCKED | LOCKDOWN | BUGCHECK | CRASH | LOGOUT | SHUTDOWN | REBOOT | BLACK_SCREEN | RECOVERY | POST | BIOS | BOOT | LOGIN | OOBE | UPDATE | LOCKED | DESKTOP`
- Move the 40+ useState calls and priority-cascade rendering logic into this hook
- Index.tsx becomes a thin renderer: `switch(systemState)` returning the right screen component
- Extract the inline site-lock JSX into `src/components/SiteLockedScreen.tsx`

## Phase 2: DefDevMain Uses useDefDevState Hook

**Goal**: Kill the duplicated state in DefDevMain.tsx.

- Replace all manual useState/useEffect in DefDevMain with a single `useDefDevState()` call
- Move console capture logic into the hook (or a dedicated `useDefDevConsoleCapture` hook)
- FloatingDefDev should also import from the shared hook instead of copy-pasting

## Phase 3: Add Missing DEF-DEV Sidebar Tabs

**Goal**: Make all imported tabs actually reachable.

- Add these to DefDevTabs sidebar groups:
  - **Diagnostics**: Boot Analyzer, Crash Analyzer, Memory Profiler
  - **Data**: Components, Supabase
  - **Tools**: Mods
- Update the `TabId` type if needed (already has most of these)

## Phase 4: DEF-DEV Status Bar

**Goal**: Add a persistent footer to DEF-DEV showing session info.

- Create `src/components/defdev/DefDevStatusBar.tsx`
- Show: log count (errors/warnings/total), localStorage usage, session uptime, current tab name
- Slim single-line bar at the bottom of DefDevMain

## Phase 5: DEF-DEV Keyboard Shortcuts

**Goal**: Power-user navigation in DEF-DEV.

- Extend `src/components/defdev/hooks/useDefDevKeyboardShortcuts.ts`
- `Ctrl+L` clear console, `Ctrl+K` focus search, `Ctrl+1-9` switch tabs, `Ctrl+Shift+T` focus terminal
- Show shortcut hints in tab labels on hover

## Phase 6: Update DEF-DEV Header Version

- Change "DEF-DEV 3.0 CONSOLE" to "DEF-DEV 3.5 CONSOLE" in DefDevHeader
- Update the subtext to match

## Phase 7: Window Global Types (from tech-debt-2)

- Add `UrbanShadeGlobals` interface to `src/vite-env.d.ts`
- Declare `adminPanel`, `maintenanceMode`, `normalMode`, `devMode`, `naviSecurity`, `systemBus`
- Replace all `(window as any).__URBANSHADE_*` and `(window as any).adminPanel` etc. with typed access

## Phase 8: Version Bump + Changelog

- Bump to V3.5.1 "Developer" in `version.json` and `index.html`
- Add changelog entry summarizing: state machine extraction, DEF-DEV consolidation, missing tabs, status bar, keyboard shortcuts, typed globals

---

## File Impact Summary

| File | Change |
|------|--------|
| `src/hooks/useSystemStateMachine.ts` | NEW — state machine extracted from Index.tsx |
| `src/components/SiteLockedScreen.tsx` | NEW — extracted component |
| `src/components/defdev/DefDevStatusBar.tsx` | NEW — status bar |
| `src/pages/Index.tsx` | Major reduction (~1082 → ~300 lines) |
| `src/components/defdev/DefDevMain.tsx` | Use useDefDevState hook, remove duplicated state |
| `src/components/defdev/DefDevTabs.tsx` | Add 6 missing tabs to sidebar |
| `src/components/defdev/DefDevHeader.tsx` | Version text update |
| `src/components/defdev/FloatingDefDev.tsx` | Use shared console capture |
| `src/components/defdev/hooks/useDefDevKeyboardShortcuts.ts` | Add shortcuts |
| `src/components/defdev/hooks/useDefDevState.ts` | Add console capture logic |
| `src/vite-env.d.ts` | Window global types |
| `src/lib/version.json` | 3.5.1 |
| `index.html` | Title update |
| `src/components/ChangelogDialog.tsx` | New entry |

