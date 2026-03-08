# URBANSHADE OS — TECH DEBT SWEEP #2: DEVELOPER EXPERIENCE

## Phase 1: Kill `as any` Epidemic
**Status**: 🔲 TODO

Priority targets:
- [ ] Supabase queries (`useFriends.ts`, `SupportTicketsTab.tsx`, `SupabaseTab.tsx`): typed query helpers
- [ ] Window globals (`Settings.tsx`): typed global declaration in `vite-env.d.ts`
- [ ] Icon lookups (`General.tsx`, `IconSelector.tsx`): typed icon map
- [ ] Performance API (`DevModeConsole.tsx`): proper type guard for `performance.memory`

---

## Phase 2: Centralized Logger Utility
**Status**: 🔲 TODO

- [ ] Create `src/lib/logger.ts` with `logger.info()`, `.warn()`, `.error()`, `.debug()`
- [ ] Respect `__URBANSHADE_VERBOSE__` flag
- [ ] Category tags: `[Auth]`, `[Sync]`, `[Chat]`, `[Boot]`, etc.
- [ ] Replace raw `console.*` calls in hook files

---

## Phase 3: Supabase Type Safety
**Status**: 🔲 TODO

- [ ] Create typed query helpers for tables already in generated types
- [ ] Remove all `from('table_name' as any)` and `(supabase as any)` casts
- [ ] Verify all used tables are present in generated types (they should be — types.ts has friends, support_tickets, etc.)

---

## Phase 4: Window Global Types
**Status**: 🔲 TODO

- [ ] Add `UrbanShadeGlobals` interface to `src/vite-env.d.ts`
- [ ] Declare `__URBANSHADE_VERBOSE__`, `__URBANSHADE_WIFI_DISABLED__`, etc.
- [ ] Replace all `(window as any).__URBANSHADE_*` with typed access

---

## Phase 5: Developer Onboarding File
**Status**: 🔲 TODO

- [ ] Create `CONTRIBUTING.md` with:
  - Project structure overview
  - How to add a new app (appRegistry.tsx)
  - How to add a changelog entry
  - How to use the logger
  - DEF-DEV tools overview
  - Version bump checklist

---

## Phase 6: Version Bump to V3.5.1 "Developer"
**Status**: 🔲 TODO

- [ ] Bump version in `src/lib/version.json`
- [ ] Update HTML title in `index.html`
- [ ] Add changelog entry for DX improvements
- [ ] Mark plan complete
