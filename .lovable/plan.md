

# Start Menu Remake -- Win 10 + macOS Hybrid

## Layout

Top-left anchored, below the taskbar. Two-panel layout side by side:

```text
┌──────────────────────────────────────────────┐
│  🔍 Search...                                │
├─────────────────────┬────────────────────────┤
│                     │                        │
│  ◆ Pinned / Recent  │   All Apps (A-Z list)  │
│  (tile grid, 3-4    │   (scrollable alpha    │
│   cols, larger      │    list with letter     │
│   icons like macOS) │    headers)            │
│                     │                        │
│                     │                        │
│                     │                        │
├─────────────────────┴────────────────────────┤
│  👤 User  ·  ⚙ Settings  │  ⏻ 🔄 🚪        │
└──────────────────────────────────────────────┘
```

**Left panel**: Pinned apps as a tile grid (larger icons, 3-4 cols) -- macOS Launchpad feel. Below that, a "Recommended" / recent section.

**Right panel**: Alphabetical scrollable list of all apps with letter group headers (A, B, C...) -- Windows 10 style sidebar list.

**Search**: Full-width at top. When typing, both panels collapse into a single filtered results list.

## Key Changes from Current

| Aspect | Current | New |
|--------|---------|-----|
| Layout | Single panel, 6-col tiny grid | Two-panel: tiles left, list right |
| Icon size | 40x40, cramped | 48x48 tiles left, 20x20 list right |
| All apps | Toggle replaces grid | Always visible in right panel |
| Width | 580px | 640px |
| App discovery | "All apps" button | Persistent scrollable list |
| Letter nav | None | Alpha group headers in list |

## File Changes

**`src/components/StartMenu.tsx`** -- Full rewrite:
- Two-panel flex layout with left (pinned grid + recommended) and right (alpha app list)
- Left panel: 3-col grid of pinned apps (first 9), larger tile buttons with icon + name
- Right panel: `ScrollArea` with apps grouped by first letter, each group has a letter header
- Search mode: both panels replaced by a single filtered results list
- Footer: user profile left, power/restart/logout right (keep existing logic)
- Close animation support: track `isClosing` state, apply `animate-start-menu-out` class, delay `onClose` by 200ms

**`src/index.css`** -- No keyframe changes needed (existing `start-menu-in`/`out` work fine).

## Details

- Pinned apps: `apps.slice(0, 9)` in a 3-col grid with 48x48 icons
- All apps list: sorted alphabetically, grouped by first letter (`A`, `B`, etc.), each group has a sticky letter header
- Recommended section: below pinned grid, shows recent files (existing logic, max 3 items)
- Right panel has its own `ScrollArea` for independent scrolling
- Keep all existing functionality: recent files tracking, reboot popover, profile navigation, click-outside-close

