# URBANSHADE OS — POLISH AND FIX TECH DEBT PLAN

## Phase 0: Save This Plan ✅
Saved to `tech-debt-plan.md`.

---

## Phase 1: Index.tsx — The 1082-Line Monster
**Status**: ✅ COMPLETE

**Work**:
- [x] Extract boot state machine into `useBootSequence` hook
- [x] Extract moderation gates into `useModerationGates` hook
- [x] Command queue handler included in useBootSequence
- [x] System bus listeners included in useBootSequence
- [x] Index.tsx reduced to ~250 lines of composition

---

## Phase 2: Desktop.tsx — App Registry Cleanup
**Status**: ✅ COMPLETE

**Work**:
- [x] Extract app registry to `src/lib/appRegistry.tsx`
- [x] Create shared `WindowData` type in `src/types/window.ts`
- [x] Remove duplicate `WindowData` interfaces
- [x] Remove dead VIP code and unused state

---

## Phase 3: WindowManager.tsx — Duplicate Interface & Import Cleanup
**Status**: ✅ COMPLETE

**Work**:
- [x] Remove duplicate `WindowData` (lines 84-88)
- [x] Move stray UrbanshadeInstaller import to top
- [x] Use shared `WindowData` type from types/window.ts

---

## Phase 4: Taskbar.tsx — Import Order & Component Colocation
**Status**: ✅ COMPLETE

**Work**:
- [x] Move all imports to top of file
- [x] Use shared `WindowData` type

---

## Phase 5: TypeScript Hygiene — Kill `as any`
**Status**: ✅ COMPLETE

**Work**:
- [x] `Report.tsx`: Type the `user` state properly
- [x] `persistence.ts`: Add generic constraint to `saveState`
- [x] `Index.tsx`: Type `crashTypes` as `Record<string, CrashType>`

---

## Phase 6: Changelog Accuracy
**Status**: ✅ COMPLETE

**Work**:
- [x] Fix v3.6.0 changelog text to describe dialog popups (not full-screen gates)
- [x] Add entry for styled HTML ban appeal emails
- [x] Add entry for edge function auth + ban verification
- [x] Bump version to 3.6.1 "Refined"

---

## Phase 7: Dead Code & Unused State
**Status**: ✅ COMPLETE (merged into Phase 2)

**Work**:
- [x] Remove dead VIP TODO / checkVipStatus function
- [x] Remove showVipWelcome duplicate state
- [x] Remove unused useSearchParams import
- [x] Remove VIP dialog duplicate from Desktop.tsx

---

## Phase 8: Edge Function Cleanup
**Status**: ✅ COMPLETE

**Work**:
- [x] `getClaims` is correct per platform instructions — no change needed
- [x] `verify_jwt = false` kept (manual auth in code)
- [x] navi-ai and navi-autonomous reviewed — no similar issues

---

## Phase 9: Final Version Bump & Plan Closeout
**Status**: ✅ COMPLETE

**Work**:
- [x] Updated `src/lib/version.json` to 3.6.1
- [x] Updated HTML title in `index.html`
- [x] Added changelog entry for tech debt sweep
- [x] All phases marked complete
