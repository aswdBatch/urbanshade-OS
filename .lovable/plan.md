

# Plan: Checkbox Acknowledgment Dialog for Temp Bans & Warnings

## Summary

Reuse the existing `TempBanPopup` dialog style for both temp bans and warnings, adding a mandatory checkbox before the "I Understand" button works, and preventing dismiss via clicking outside or pressing Escape.

## Changes

### 1. Update TempBanPopup.tsx
- Add a checkbox + label: "I acknowledge this suspension"
- Disable the "I Understand" button until checkbox is checked
- Prevent closing by clicking outside or pressing Escape: change `onOpenChange` to a no-op, and add `onPointerDownOutside` / `onEscapeKeyDown` with `preventDefault` on the DialogContent

### 2. Create ModerationWarningPopup.tsx (or reuse TempBanPopup with a `variant` prop)
Better approach: create a new `ModerationWarningPopup.tsx` that mirrors the TempBanPopup dialog style but with warning-specific content (no time remaining, different title/text). Same checkbox + non-dismissible behavior.

### 3. Update Index.tsx
- Replace `TempBanScreen` (full-screen) gate with `TempBanPopup` dialog (with checkbox)
- Replace `ModerationWarningScreen` (full-screen) gate with new `ModerationWarningPopup` dialog (with checkbox)
- Keep the same gating logic -- just render dialogs instead of full-screen components

### 4. Cleanup
- Remove `TempBanScreen.tsx` and `ModerationWarningScreen.tsx` (the full-screen versions) since they're no longer used
- Keep `TempBanScreen` and `ModerationWarningScreen` components available in `ScreenPreviewTab.tsx` for mod testing -- update those previews to use the popup versions instead

### Files
| File | Action |
|------|--------|
| `src/components/TempBanPopup.tsx` | Add checkbox, block outside dismiss |
| `src/components/ModerationWarningPopup.tsx` | **New** -- warning dialog with checkbox |
| `src/pages/Index.tsx` | Swap full-screen gates for popup dialogs |
| `src/components/TempBanScreen.tsx` | Delete |
| `src/components/ModerationWarningScreen.tsx` | Delete |
| `src/components/defdev/tabs/ScreenPreviewTab.tsx` | Update to preview popup versions |

