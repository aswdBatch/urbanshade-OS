# Changelog: Apology Banner + Window Optimization

## 1. Apology banner for v3.5.0

Add a new `apology` field to the v3.5.0 changelog entry, rendered as a styled card above the thank-you/overview section. Warm tone, short message acknowledging the long wait for the optimization update.

Text along the lines of: *"We know this update took a while - and we're sorry for the wait. V3.5.0 was a massive behind-the-scenes overhaul, and we wanted to get it right. At the same time, school was hitting us hard and I, Aswd, was experimenting on side projects. Thank you for your patience, and we hope it'll be worth it."*

Rendered as a card with an amber/yellow gradient tint and a `Heart` or `Clock` icon, similar to the existing `thankyou` card style.

## 2. Changelog window optimizations

**Performance:**

- Wrap `changelogs` object in `useMemo` (it's currently recreated every render with JSX icon nodes)
- Memoize `renderVersionButton` with `useCallback`

**UI polish:**

- Add `transition-all duration-200` to the main content area for smoother version switching
- Add a subtle fade transition when switching between versions (key the content by `selectedVersion`)
- Reduce the header gradient height slightly for less wasted space
- Make section cards collapsible (click header to toggle) to reduce scroll fatigue on large changelogs like v3.5.0

All changes in `src/components/ChangelogDialog.tsx`.