

# Start Menu: Greeting + Visual Tiles

## Overview
Add back the time-based greeting header above the app list, and upgrade the app items from plain list rows to visual tiles with colored icon backgrounds.

## Changes -- `src/components/StartMenu.tsx`

**1. Add greeting header** between search and app list:
- `getGreeting()` function returning "Good morning" / "Good afternoon" / "Good evening" based on hour
- Display: `"{greeting}, {firstName}"` with current date below, spanning full width
- Separated from the app list by a subtle border

**2. Visual tiles** -- replace the plain `flex items-center` list rows with tile-style buttons:
- Each app rendered as a rounded tile with a tinted icon background circle (using `primary` color at low opacity)
- Icon size bumped to `w-6 h-6`, background circle `w-10 h-10`
- App name below or beside the icon with slightly bolder text
- Hover: scale up slightly + brighter background
- Keep the A-Z letter headers and `ScrollArea` structure

```text
┌──────────────────────────────┐
│  🔍 Search...                │
│                              │
│  Good evening, User          │
│  Sunday, March 9, 2025       │
├──────────────────────────────┤
│  A                           │
│  ┌────────┐ ┌────────┐      │
│  │  (●)   │ │  (●)   │ ...  │
│  │ App 1  │ │ App 2  │      │
│  └────────┘ └────────┘      │
│  B                           │
│  ┌────────┐                  │
│  │  (●)   │                  │
│  │ App 3  │                  │
│  └────────┘                  │
├──────────────────────────────┤
│  👤 User     │  ⏻ 🔄 🚪     │
└──────────────────────────────┘
```

Tiles arranged in a responsive grid (3-4 columns) within each letter group, rather than a single-column list. This gives the macOS Launchpad feel while keeping the Windows A-Z grouping.

**Search mode**: stays as a single-column filtered list (current behavior).

