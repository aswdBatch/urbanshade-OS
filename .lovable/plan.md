
# App Store Redesign + Responsive Fix

## Problem
The App Store breaks on narrower desktop windows. The layout has several hard-coded widths and inflexible grid structures that overflow or clip content when the window is resized smaller.

## Key Issues Found
1. **Sort dropdown** has a fixed `w-[140px]` width that doesn't shrink
2. **App card action buttons** (Install/Open/Uninstall) get pushed off-screen on narrow cards because they use `shrink-0` but there's not enough room
3. **Stats grid** in the app detail view uses `grid-cols-4` which squishes on narrow windows
4. **Category pills** row works with overflow-x-auto, but combined with the search row it wastes vertical space
5. **Trending section** horizontal scroll cards have rigid minimum widths
6. **Header** takes too much vertical space with the large icon, title, tabs all stacked

## Plan

### 1. Compact Header Redesign
- Merge the App Store title/icon into a slimmer single-line header
- Move the installed count badge inline with the title
- Make tabs smaller and tighter

### 2. Fix Search + Sort Row
- Change the sort dropdown from `w-[140px]` to a responsive width (icon-only on narrow, full on wider)
- Ensure the search input takes remaining space with `min-w-0`

### 3. Fix App Cards for Narrow Widths
- Move Install/Open buttons below the app info when space is tight (stack vertically under a certain width)
- Use `flex-wrap` so the action buttons wrap below instead of overflowing
- Ensure description text truncates properly

### 4. Fix Stats Grid in Detail View
- Change from `grid-cols-4` to `grid-cols-2 sm:grid-cols-4` so it wraps on narrow windows

### 5. Fix Trending Cards
- Reduce minimum card width for narrow windows
- Ensure the scroll container works without overflow issues

### 6. Fix New Releases Grid
- Already uses `grid-cols-1 sm:grid-cols-2` which is fine -- just verify it works

---

### Technical Details

**File: `src/components/apps/AppStore.tsx`**

Changes by section:

- **Line ~638**: Sort `SelectTrigger` -- change `w-[140px]` to `w-[44px] sm:w-[140px]` and hide the `SelectValue` text on small widths, showing only the icon
- **Line ~380**: Stats grid -- change `grid-cols-4` to `grid-cols-2 sm:grid-cols-4`
- **Lines ~692-711**: Trending cards -- reduce `min-w-[120px]` / padding for narrower widths
- **Lines ~1011-1069**: `AppCard` component -- restructure to use `flex-wrap` on the outer container so action buttons wrap below on narrow cards, or switch to a stacked layout
- **Line ~506-548**: Header -- tighten padding and make the layout more compact

This is a single-file change to `AppStore.tsx`. No new files or dependencies needed. Version bump not required (UI polish, not a feature).
