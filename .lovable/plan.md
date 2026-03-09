

# Plan: V3.5.0 Extreme Polish Pass

Keep every design exactly the same. Focus purely on smoothing rough edges, tightening animations, improving micro-interactions, and adding subtle realism cues across every surface of the OS.

---

## 1. Window Chrome Polish

**File: `src/components/Window.tsx`**

- Add a subtle `will-change: transform` during drag only (remove on drop) to eliminate jank
- Smooth the close button hover: fade to red over 150ms instead of instant snap
- Add a 1px inset shadow on the title bar for depth (`inset 0 1px 0 rgba(255,255,255,0.04)`)
- Window open animation: use a spring curve with slight overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)` over 250ms) instead of the current linear scale-in
- Window close animation: shrink toward the taskbar position (scale to 0.9 + fade, 150ms)
- Loading state: replace the plain spinner with a subtle shimmer skeleton across the content area
- Resize handle: increase hit target to 6x6px, add a subtle grow on hover

## 2. Taskbar Micro-interactions

**File: `src/components/Taskbar.tsx`**

- Pinned app icons: add a subtle bounce (`translateY(-2px)`) on hover, 200ms spring ease
- Active window indicator: animate the green dot in with a scale-in, not just appear
- Clock in top bar: smooth digit transitions (use `tabular-nums` font-feature to prevent layout shift)
- Add a thin 1px highlight line along the top of the taskbar (`linear-gradient` pseudo-element) for glass edge realism
- Separator dividers: animate opacity in when windows appear, fade out when they close

## 3. Start Menu Refinements

**File: `src/components/StartMenu.tsx`**

- Open animation: slide up from taskbar + fade (not just `scale-in`), with staggered app icon entries (15ms per icon, already has delay but isn't animated)
- App icons: add a subtle press-down scale (0.95) on mousedown, spring back on release
- Search input: add a focus ring glow animation (pulsing `box-shadow` on focus)
- Footer user area: add a subtle hover background transition
- Close animation: currently just disappears -- add a `scale-out` + `fade-out` exit

## 4. Desktop Surface

**File: `src/components/Desktop.tsx`**

- Reduce grid overlay opacity from `0.02` to `0.015` (barely visible but cleaner)
- Desktop icons: stagger fade-in on first render (each icon 30ms delay)
- Context menu: add subtle shadow depth and a 1px inner border highlight

**File: `src/components/DesktopIcon.tsx`**

- Double-click feedback: brief flash/pulse on the icon when launching an app
- Hover: add a very subtle glow under the icon container (`box-shadow: 0 4px 12px hsl(var(--primary) / 0.1)`)

## 5. Lock Screen & Login Polish

**File: `src/components/LockScreen.tsx`**

- Clock: use `font-variant-numeric: tabular-nums` to prevent jitter on time changes
- Password field: add a shake animation on wrong password (translateX oscillation, 300ms)
- Unlock transition: fade-to-white flash then dissolve (instead of instant cut)

**File: `src/components/UserSelectionScreen.tsx`**

- User cards: add hover lift effect (`translateY(-2px)` + shadow increase)
- Selected user: animate the password field sliding in from below
- Wrong password: shake the input field

## 6. Boot Screen Smoothing

**File: `src/components/BootScreen.tsx`**

- Progress bar: add a subtle gradient shine sweep across the bar as it fills
- Status text: crossfade between stages instead of instant swap
- Completion: brief hold on "Welcome" before transitioning

## 7. Global Animation System Upgrades

**File: `tailwind.config.ts`**

Add new keyframes:
- `window-open`: spring scale from 0.92 with overshoot
- `window-close`: scale to 0.9 + fade out toward bottom
- `shake`: horizontal oscillation for error feedback
- `shimmer`: gradient sweep for loading states
- `stagger-in`: fade + translateY for lists

**File: `src/index.css`**

- Add `font-variant-numeric: tabular-nums` to mono elements globally
- Add `.animate-shake` utility class
- Add `.animate-shimmer` utility class for skeleton loading
- Window animation classes (`animate-window-open`, `animate-window-close`, `animate-window-minimize`)

## 8. Notification Center & Quick Settings

**File: `src/components/NotificationCenter.tsx`**

- Panel open: slide in from right with a spring curve (not just appear)
- Notifications: stagger-animate each card on open
- Dismiss: slide-out-right animation before removal

**File: `src/components/QuickSettingsFlyout.tsx`**

- Toggle buttons: add a subtle scale pulse when toggled
- Sliders: smoother thumb transition

---

## Summary

| Area | Changes |
|------|---------|
| Window.tsx | Spring open/close, drag perf, shimmer loading, title bar depth |
| Taskbar.tsx | Icon bounce, dot animation, glass edge, tabular-nums |
| StartMenu.tsx | Slide-up open, press feedback, exit animation |
| Desktop.tsx | Staggered icon entry, grid tweak |
| DesktopIcon.tsx | Launch flash, hover glow |
| LockScreen.tsx | Tabular-nums, shake on error, unlock transition |
| UserSelectionScreen.tsx | Card lift, password slide-in, error shake |
| BootScreen.tsx | Progress shine, text crossfade |
| tailwind.config.ts | New keyframes (spring, shake, shimmer) |
| index.css | New utility classes, tabular-nums |
| NotificationCenter.tsx | Slide-in, stagger cards, dismiss animation |
| QuickSettingsFlyout.tsx | Toggle pulse, smoother sliders |

All changes stay under V3.5.0. No new features, no layout changes -- pure polish.

