
# Urbanshade OS v3.5.0 "Polished" — Completed

## What was done

### 1. Nuked Legacy DevMode.tsx
- Deleted the 1514-line monolith `src/pages/DevMode.tsx`
- `/def-dev` route already used the modular `DefDevMain.tsx` — no routing changes needed
- All 17 tabs preserved in the sidebar-based architecture

### 2. Site Lock Now Works
- `handleLockdown` and `handleLiftLockdown` in ModerationPanel now persist to `site_locks` table in Supabase
- Index.tsx checks `site_locks` on load and every 30s
- Non-admin users see a full-screen "SITE LOCKED" screen when locked
- Admins bypass the lock automatically via `has_role` RPC check
- Moderation panel loads current lock status on init

### 3. Version Bump
- `version.json`: 3.4.1 → 3.5.0, codename "Polished", build 8500
- `index.html` title: V3.4.1 → V3.5.0
- Changelog entry added to `ChangelogDialog.tsx`

### 4. DEF-DEV Console
- Floating DEF-DEV overlay already available via `FloatingDefDev.tsx`
- Console capture, performance, and network tabs work in mini mode
- Keyboard shortcuts via `useDefDevKeyboardShortcuts.ts`

## Files Changed
- `src/pages/DevMode.tsx` — DELETED
- `src/pages/ModerationPanel.tsx` — Site lock persistence + status fetch
- `src/pages/Index.tsx` — Site lock check + locked screen
- `src/lib/version.json` — Version bump
- `index.html` — Title update
- `src/components/ChangelogDialog.tsx` — v3.5.0 entry
