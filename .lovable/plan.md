

# Start Menu: Keyboard Navigation + Polish & Animations

## Changes -- `src/components/StartMenu.tsx`

### 1. Keyboard Navigation
- Track a `focusedIndex` state for the currently highlighted tile
- Arrow keys (Up/Down/Left/Right) move focus through the grid (4 columns, so Left/Right move by 1, Up/Down move by 4)
- Enter opens the focused app, Escape closes the menu
- When searching, Up/Down navigate the filtered list, Enter opens highlighted result
- Visual focus ring on the active tile (`ring-2 ring-primary/60`)
- Reset `focusedIndex` when search changes or menu opens

### 2. Polish & Animations
- **Tile entrance**: Stagger-in animation on each tile when the menu opens -- use `animate-stagger-in` with incremental `animationDelay` based on index
- **Hover glow**: Add a subtle `shadow-primary/10` on hover for tiles, making the icon background brighten more smoothly
- **Letter headers**: Fade in with slight delay per group
- **Search results**: Already have stagger-in -- keep as-is
- **Footer buttons**: Add `active:scale-95` for tactile press feedback
- **Greeting**: Fade-in animation on the greeting text

### 3. Tailwind Config
- Add `animate-stagger-in` keyframe if not already present (check first, may already exist from prior work)

All changes contained to `src/components/StartMenu.tsx` and potentially `tailwind.config.ts` for any missing keyframes.

