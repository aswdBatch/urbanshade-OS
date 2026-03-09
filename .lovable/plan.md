

# Plan: Next Improvement Sweep -- V3.8.1

After auditing the current codebase, here are the remaining high-impact issues grouped into phases.

---

## Problem Areas Found

1. **WindowManager is a 300-line switch statement** with 60+ imports and duplicate `case "music-player"` (lines 164 and 193 -- second one renders VideoPlayer, unreachable). No app content mapping -- just a giant manual switch.

2. **FloatingDefDev still duplicates console capture** (lines 32-65) instead of using `useDefDevState`. The Phase 2 fix from the last sweep only fixed DefDevMain but not FloatingDefDev.

3. **Desktop.tsx is 436 lines** with window management, app filtering, context menus, keyboard shortcuts, widget management, and snap indicators all inline. The window state (`windows`, `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`) should be a hook.

4. **Taskbar imports before component definition** (line 49) -- imports are split around the `NotificationButton` component definition, which is unusual and fragile.

5. **WindowManager default text says "v3.1"** (line 278) -- stale version string.

6. **Window.tsx has each-window snap detection** via `useWindowSnap()` AND Desktop has its own `useWindowSnap()` -- double instantiation of the same hook, potentially conflicting.

7. **`(window as any).naviSecurity`** in Index.tsx (line 52) -- still untyped despite the Phase 7 globals work.

---

## Phase 1: Extract Window State Hook

Create `src/hooks/useWindowManager.ts` extracting from Desktop.tsx:
- `windows`, `nextZIndex` state
- `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `restoreWindow` callbacks
- Installer event listener
- Installed apps tracking + filtering logic

Desktop.tsx drops from ~436 to ~250 lines, becoming purely a layout/render component.

## Phase 2: WindowManager App Content Map

Replace the 60-case switch in WindowManager.tsx with a `Record<string, (props) => JSX.Element>` map object. Benefits:
- Eliminates the duplicate `music-player` case (bug fix)
- Reduces file from 300 to ~120 lines
- Makes it trivial to add new apps (one line per app)
- Fix stale "v3.1" in the default fallback to use `VERSION.displayVersion`

## Phase 3: FloatingDefDev Uses Shared State

Replace FloatingDefDev's manual console capture (lines 32-65) and local `logs`/`filter` state with `useDefDevState()`. This was supposed to happen in the last sweep but was missed.

## Phase 4: Taskbar Import Cleanup

Move the `NotificationButton` component below all imports in Taskbar.tsx, or extract it to its own file. Currently imports are split around the component definition which can cause bundler issues.

## Phase 5: Fix Duplicate useWindowSnap

Window.tsx and Desktop.tsx both call `useWindowSnap()`. The Desktop instance drives `WindowSnapIndicator` but its `handleDragMove`/`handleDragEnd` are never connected to actual window drags. Remove the Desktop-level `useWindowSnap()` and have Window.tsx be the sole owner. Pass snap zone up via callback if needed for the indicator.

## Phase 6: Typed Window Globals

Add `naviSecurity` to the `UrbanShadeGlobals` interface in `vite-env.d.ts`. Replace `(window as any).naviSecurity` in Index.tsx with typed access.

## Phase 7: Version Bump + Changelog

- Bump to V3.8.1 "Modular" in `version.json` and `index.html`
- Changelog entry: window manager refactor, FloatingDefDev fix, Desktop extraction, duplicate snap fix

---

## File Impact

| File | Change |
|------|--------|
| `src/hooks/useWindowManager.ts` | NEW -- window state extracted from Desktop |
| `src/components/Desktop.tsx` | Major reduction, uses `useWindowManager` |
| `src/components/WindowManager.tsx` | Switch -> map, fix duplicate case, fix version |
| `src/components/defdev/FloatingDefDev.tsx` | Use `useDefDevState` |
| `src/components/Taskbar.tsx` | Move imports above component |
| `src/components/Window.tsx` | Sole owner of snap logic |
| `src/pages/Index.tsx` | Typed `naviSecurity` global |
| `src/vite-env.d.ts` | Add `naviSecurity` type |
| `src/lib/version.json` | 3.8.1 |
| `index.html` | Title bump |
| `src/components/ChangelogDialog.tsx` | New entry |

