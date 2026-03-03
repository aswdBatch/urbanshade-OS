

# Plan: Ban/Warn Screen Improvements & Mod Testing Tab

## Current State

- **Ban appeal**: Only has a username field, no free-text reason/message input. The email template has a static "Write reason here" placeholder that never gets filled.
- **Warning system**: Warnings only show as a sonner toast notification -- easily missed, no acknowledgment required. Users can keep using the OS without even noticing.
- **Temp ban**: Shows a dismissible dialog popup. Once dismissed, only a thin top banner remains. No acknowledgment gate.
- **FakeMod tab**: Triggers actions via command queue to the main OS window, but warns only show as toasts. No way to preview the actual screens inline inside DEF-DEV.

## Changes

### 1. Improve Ban Appeal Form (BannedScreen.tsx + send-appeal edge function)

Add a **textarea** for the user to write their appeal reason/message (not just username). The appeal email should include this user-written message instead of the static "Write reason here" placeholder.

- Add a `appealMessage` textarea field below the username input
- Require both username and message before enabling submit
- Pass `appealMessage` to the `send-appeal` edge function
- Update the edge function email template to include the user's actual message

### 2. Warning Acknowledgment Screen (new: WarningScreen.tsx)

Create a full-screen warning overlay that blocks OS usage until acknowledged, similar to how bans work but amber/yellow themed.

- Full-screen amber/dark overlay with warning icon
- Shows the warning reason
- "I Understand" button that must be clicked to continue
- Once acknowledged, stored in `useBanCheck` state so it doesn't reappear

**Integration in useBanCheck.ts:**
- Extend the hook to also check for unacknowledged `warn` actions in `moderation_actions`
- Track acknowledged warnings in localStorage per-user (`urbanshade_ack_warnings_${userId}`)
- Return `pendingWarning` with reason if there's an unacknowledged warning

**Integration in Index.tsx:**
- Render `WarningScreen` after ban checks but before desktop, gating access until acknowledged

### 3. Temp Ban Acknowledgment Gate

Currently temp bans show a dismissible dialog. Change it so the temp ban popup **cannot be bypassed** -- the "I Understand" button is required, but the flow stays the same (dismisses to banner). This is already mostly working, just needs to be enforced as a gate in Index.tsx render order (before desktop render, not as an overlay on top).

- Move temp ban check into the render cascade in Index.tsx (like permanent bans) instead of rendering it as a dialog overlay
- Show a full-screen temp ban acknowledgment screen (reuse/adapt TempBanPopup into a full-screen version)
- After acknowledgment, show the desktop with the existing TempBanBanner

### 4. Mod Screen Preview Tab (new: ScreenPreviewTab.tsx in defdev/tabs/)

A new DEF-DEV tab called "Screen Preview" that renders the actual ban, temp ban, and warning screens **inline** with an X button overlay to close.

- Tab shows 3 preview cards: "Permanent Ban", "Temporary Ban", "Warning"
- Clicking one renders the actual component full-screen with a close button (X in top-right corner, z-index above the screen)
- Uses the real `BannedScreen`, `TempBanPopup` (full-screen version), and `WarningScreen` components with mock data
- No command queue needed -- renders directly inside DEF-DEV's own page

**Integration:**
- Add to `DefDevMain.tsx` sidebar tabs
- Register in the tab rendering switch

### 5. FakeMod Warning Update

Update the `FAKE_WARN` handler in Index.tsx to show the new `WarningScreen` instead of just a toast, matching the real warning behavior.

## File Changes Summary

| File | Action |
|------|--------|
| `src/components/BannedScreen.tsx` | Add appeal message textarea |
| `supabase/functions/send-appeal/index.ts` | Include user's appeal message in email |
| `src/components/WarningScreen.tsx` | **New** -- full-screen warning acknowledgment |
| `src/components/TempBanScreen.tsx` | **New** -- full-screen temp ban acknowledgment (replaces dialog for gate) |
| `src/hooks/useBanCheck.ts` | Add warning check, return `pendingWarning` |
| `src/pages/Index.tsx` | Add warning/temp-ban gates in render cascade, update FAKE_WARN handler |
| `src/components/defdev/tabs/ScreenPreviewTab.tsx` | **New** -- inline screen previewer |
| `src/components/defdev/DefDevMain.tsx` | Add Screen Preview tab |

## Priority Order

1. Warning acknowledgment screen (biggest UX gap)
2. Temp ban gate enforcement
3. Ban appeal form improvement
4. Screen Preview tab for mods
5. FakeMod warning update

