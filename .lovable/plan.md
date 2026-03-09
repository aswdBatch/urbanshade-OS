
# Plan: V3.5.0 Improvement Sweep (Architectural)

## Completed

### Phase 1: Split useBootSequence (620 → ~300 lines)
- ✅ Extracted `useBootKeyboard.ts` — keyboard shortcuts with `useRef` keyBuffer (no re-render storm)
- ✅ Extracted `useBootConsoleCommands.ts` — window.adminPanel/maintenanceMode/normalMode/devMode
- ✅ Extracted `useCommandQueueHandler.ts` — 150-line command queue switch block
- ✅ Separated admin setup check into its own `useEffect`

### Phase 2: Complete Window Global Types
- ✅ Added `__URBANSHADE_VERBOSE__`, `__URBANSHADE_WIFI_DISABLED__`, `__URBANSHADE_OFFLINE_MODE__`, `__URBANSHADE_TELEMETRY__`, `__URBANSHADE_AUTO_UPDATES__` to `vite-env.d.ts`
- ✅ Added typed `systemBus`, `devStorage`, `webkitAudioContext`
- ✅ Replaced `(window as any)` in `systemBus.ts` and `devStorage.ts`

### Phase 3: Remove Dead Changelog Auto-Open
- ✅ Removed redundant `useEffect` from `ChangelogDialog.tsx` (was dead code when controlled)
- ✅ Removed unused `useEffect` import

### Phase 4: Fix keyBuffer Re-render Storm
- ✅ Converted `keyBuffer` from `useState` to `useRef` in `useBootKeyboard.ts`
