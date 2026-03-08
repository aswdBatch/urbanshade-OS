

# URBANSHADE OS -- POLISH AND FIX TECH DEBT PLAN

## Phase 0: Save This Plan
Save this plan to `tech-debt-plan.md` in the project root for ongoing reference. Each phase includes a checklist.

---

## Phase 1: Index.tsx -- The 1082-Line Monster
**Problem**: `Index.tsx` is a single 1082-line file with ~30 `useState` calls, inline event handlers, and the entire boot cascade logic jammed together.

**Work**:
- Extract boot state machine into a `useBootSequence` hook (all boot/POST/BIOS/reboot/shutdown/crash/recovery/lockdown state + handlers)
- Extract moderation gates (ban check rendering, fake ban/warn/temp-ban state) into a `useModerationGates` hook
- Extract command queue handler (the giant switch statement, lines 288-506) into a `useCommandHandler` hook
- Extract system bus listeners (lines 508-561) into a `useSystemBusListeners` hook
- Result: Index.tsx becomes ~200 lines of composition

**Checklist**: [ ] Hooks extracted [ ] Index.tsx under 300 lines [ ] No functional regressions [ ] Re-read plan

---

## Phase 2: Desktop.tsx -- App Registry Cleanup
**Problem**: Desktop.tsx is 1110 lines. 600+ lines are just the `allApps` array definition -- a massive inline array of objects with JSX icons. Duplicate `WindowData` interfaces exist across 5 files.

**Work**:
- Extract app registry to `src/lib/appRegistry.tsx` -- single source of truth for all app definitions
- Create a shared `WindowData` type in `src/types/window.ts`, import it everywhere (Desktop, Taskbar, WindowManager, AltTabSwitcher, TaskView, useKeyboardShortcuts)
- Remove the duplicate `WindowData` interface on lines 84-88 of WindowManager.tsx
- Remove the stale `allAppsRef` pattern (line 242) -- use a proper ref or context

**Checklist**: [ ] App registry extracted [ ] Shared types file created [ ] Duplicate interfaces removed [ ] Re-read plan

---

## Phase 3: WindowManager.tsx -- Duplicate Interface & Import Cleanup
**Problem**: Two `WindowData` interfaces defined (lines 65 and 84). Stray import of `UrbanshadeInstaller` on line 90 wedged between interface and component. 64 imports at the top.

**Work**:
- Remove duplicate `WindowData` (lines 84-88)
- Move the stray `UrbanshadeInstaller` import to the top with other imports
- Use the shared `WindowData` type from Phase 2
- Lazy-load app components where possible (dynamic `import()` in the switch statement) to reduce initial bundle

**Checklist**: [ ] Duplicates removed [ ] Imports reorganized [ ] Shared type used [ ] Re-read plan

---

## Phase 4: Taskbar.tsx -- Import Order & Component Colocation
**Problem**: The `NotificationButton` component is defined before the imports of its dependencies (lines 6-48, then more imports on lines 49-57). This is confusing and non-standard.

**Work**:
- Move all imports to the top of the file
- Move `NotificationButton` to after all imports, or extract to its own file
- Use shared `WindowData` type from Phase 2

**Checklist**: [ ] Import order fixed [ ] Shared type used [ ] Re-read plan

---

## Phase 5: TypeScript Hygiene -- Kill `as any`
**Problem**: 1710 matches for `any` across 116 files. Many are legitimate (edge function Deno code, dynamic icon lookups), but several are lazy casts.

**Work** (highest-impact files only):
- `src/components/apps/SystemMessages.tsx`: Replace `(selectedMessage as any)._type` with a proper discriminated union type
- `src/pages/Report.tsx`: Type the `user` state properly, replace `catch (err: any)` with `catch (err: unknown)`
- `src/hooks/useKeyboardShortcuts.ts`: Type `openWindow` and `allApps` properly using the `App` type
- `src/pages/Index.tsx`: Type `crashTypes` object on line 707 instead of `const crashTypes: any`
- `src/lib/persistence.ts`: Add generic constraint to `saveState` instead of `data: any`

**Checklist**: [ ] SystemMessages typed [ ] Report.tsx typed [ ] Keyboard shortcuts typed [ ] Index crashTypes typed [ ] Persistence typed [ ] Re-read plan

---

## Phase 6: Changelog Accuracy
**Problem**: The v3.6.0 changelog references "full-screen temp ban screen" and "full-screen gate" but the actual implementation uses dialog popups (per the plan we just shipped). The changelog doesn't reflect the later styled HTML email update.

**Work**:
- Fix v3.6.0 changelog text to accurately describe dialog popups with checkbox acknowledgment
- Add entry for styled HTML ban appeal emails
- Add entry for edge function auth + ban verification on send-appeal
- Bump version to 3.6.1 "Polished" (or similar) in `version.json` and HTML title

**Checklist**: [ ] Changelog accurate [ ] Version bumped [ ] HTML title updated [ ] Re-read plan

---

## Phase 7: Dead Code & Unused State
**Problem**: Various small issues scattered across files.

**Work**:
- `Desktop.tsx` line 109: VIP TODO comment with dead code -- either implement or remove the `checkVipStatus` function (it does nothing)
- `Desktop.tsx` line 68: `showVipWelcome` state is set but the VIP dialog at bottom is never triggered (the real one is in Index.tsx via banCheck) -- remove duplicate
- `StartMenu.tsx` line 26: `rebootMenuOpen` state is defined but check if it's actually used
- Remove `useSearchParams` import in Desktop.tsx if URL params are handled via `window.location.search` directly (line 189)

**Checklist**: [ ] Dead VIP code cleaned [ ] Unused state removed [ ] Imports cleaned [ ] Re-read plan

---

## Phase 8: Edge Function Cleanup
**Problem**: `supabase/config.toml` has `verify_jwt = false` for send-appeal, but the function now does manual JWT auth. The `getClaims` method may not exist on the Supabase JS client.

**Work**:
- Fix send-appeal auth: use `supabase.auth.getUser()` instead of `getClaims` (which doesn't exist in supabase-js v2)
- Remove `verify_jwt = false` from config.toml since we want Supabase to pass the JWT header through (or keep it false and continue manual auth -- just make the auth actually work)
- Review navi-ai and navi-autonomous edge functions for similar patterns

**Checklist**: [ ] Auth method fixed [ ] Config.toml correct [ ] Other edge functions reviewed [ ] Re-read plan

---

## Phase 9: Final Version Bump & Plan Closeout
**Work**:
- Update `src/lib/version.json` to new version
- Update HTML title in `index.html`
- Add final changelog entry summarizing the tech debt sweep
- Mark all phases complete in `tech-debt-plan.md`

**Checklist**: [ ] Version bumped [ ] Title updated [ ] Changelog added [ ] Plan marked complete

