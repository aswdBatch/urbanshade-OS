## Changelog Remake, Redesign, and Fixes -- V3.4.1

### Problem Summary

1. **Changelog doesn't show up**: The auto-open logic checks if you've already seen the current version. Since V3.4.0 was set as seen during development, it won't show again automatically.
2. **Getting disorganized**: 8 version entries in a flat sidebar is getting unwieldy. Older versions (2.x) clutter the view.
3. **No way to reopen**: Once closed, there's no button anywhere to view it again.

---

### Fix 1: Auto-Open Bug

The `ChangelogDialog` compares `localStorage("urbanshade_last_seen_version")` against the current version. If they match, it stays closed. The fix:

- Reset the stored version on each new build number change (not just version string), so patch updates also trigger it
- Add a small delay before checking to avoid race conditions with other boot screens

### Fix 2: Reorganize Changelog with Version Groups

Instead of a flat list of 8+ versions in the sidebar, group them:

```text
Current
  v3.4.0 Storefront

V3.x Series
  v3.3.1 Panel Polish
  v3.1   DEF-DEV & Polish
  v3.0   The Year Update

Legacy (V2.x)
  v2.9  Visual Overhaul
  v2.8  The Mass Update
  v2.7  Cloud Sync
  v2.6  Security Update
  v2.0  The Vite Rewrite
```

- The "Current" version is visually prominent at the top with a gradient highlight
- Legacy versions are in a collapsible section, collapsed by default
- Each group has a subtle header label

### Fix 3: Add "View Changelog" to Settings > System

Add a "View Changelog" button in the System section of Settings (next to the existing version/build info card). When clicked, it opens the ChangelogDialog in controlled mode.

This requires:

- Adding a `ChangelogDialog` import and state to `Settings.tsx`
- Adding a button in `renderSystem()` under the OS Information card
- The button reads "View Changelog" with an arrow icon

---

### Technical Details

**Files modified:**


| File                                 | Change                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `src/components/ChangelogDialog.tsx` | Fix auto-open logic (compare build number too); reorganize sidebar into grouped sections with collapsible "Legacy" area |
| `src/components/apps/Settings.tsx`   | Import ChangelogDialog, add state + "View Changelog" button in the System section                                       |
| `src/lib/version.json`               | DO NOT BUMP! Change is minor.                                                                                           |
| `index.html`                         | Update title to V3.4.1                                                                                                  |


**No new dependencies needed.**

### Changelog Entry

V3.4 -- Changelog remake: fixed auto-open detection, grouped versions by era with collapsible legacy section, added "View Changelog" button in Settings > System.