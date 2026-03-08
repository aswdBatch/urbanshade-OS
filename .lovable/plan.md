

# Plan: Merge Changelogs into V3.5.0 + New Tech Debt Sweep

## Part 1: Merge Version Changelogs

The changelog currently has separate entries for 3.7.0, 3.6.1, 3.6.0, and 3.5.0. Since we're back at V3.5.0 "Polished", we need to fold all those improvements into the 3.5.0 entry (they did ship, just under 3.5.0).

**Changes:**
- Remove the `3.7.0`, `3.6.1`, and `3.6.0` entries from `ChangelogDialog.tsx`
- Merge their notable sections into the `3.5.0` entry, adding sections for:
  - Documentation overhaul (from 3.7.0)
  - Architecture refactor and code quality (from 3.6.1)
  - Moderation gates and ban appeals (from 3.6.0)
- Keep 3.5.0's existing sections (Site Lock, DEF-DEV Cleanup, etc.)
- Update overview text to reflect the combined scope

---

## Part 2: New Tech Debt Plan — Developer Experience Focus

Saved to a new `tech-debt-2.md` plan file.

### Phase 1: Kill `as any` Epidemic (56 files, 736 matches)
The codebase has widespread `as any` usage. Priority targets:
- **Supabase queries** (`useFriends.ts`, `SupportTicketsTab.tsx`, `SupabaseTab.tsx`): These cast `supabase` or table names to `any` because the generated types don't include those tables. Fix by extending the Supabase types or creating typed query helpers.
- **Window globals** (`Settings.tsx`): Replace `(window as any).__URBANSHADE_*` with a typed global declaration in `vite-env.d.ts`.
- **Icon lookups** (`General.tsx`): Replace `(icons as any)[name]` with a typed icon map.
- **Performance API** (`DevModeConsole.tsx`): Proper type guard for `performance.memory`.

### Phase 2: Centralized Error/Logger Utility
354 raw `console.log/warn/error` calls across 21 hook files. Create a lightweight `src/lib/logger.ts`:
- `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
- Respects a verbose flag (`__URBANSHADE_VERBOSE__`)
- Structured category tags (e.g., `[Auth]`, `[Sync]`, `[Chat]`)
- Easy grep target for devs, cleaner than raw console calls

### Phase 3: Supabase Type Safety
- Regenerate or manually extend `src/integrations/supabase/types.ts` to include missing tables (`friends`, `support_tickets`, `ticket_messages`, `site_status`)
- Remove all `from('table_name' as any)` and `(supabase as any)` casts
- Create typed helper functions for common query patterns

### Phase 4: Window Global Types
- Add `UrbanShadeGlobals` interface to `src/vite-env.d.ts` declaring `__URBANSHADE_VERBOSE__`, `__URBANSHADE_WIFI_DISABLED__`, etc.
- Replace all `(window as any).__URBANSHADE_*` with typed access
- Single source of truth for all global flags

### Phase 5: Developer Onboarding File
- Create `CONTRIBUTING.md` with:
  - Project structure overview (key directories and their purpose)
  - How to add a new app (use `appRegistry.tsx`)
  - How to add a changelog entry
  - How to use the logger
  - DEF-DEV tools overview
  - Version bump checklist

### Phase 6: Version Bump to V3.5.1 "Developer" + Changelog + Closeout
- Bump version to 3.5.1 with codename "Developer"
- Add changelog entry summarizing the DX improvements
- Mark plan complete

