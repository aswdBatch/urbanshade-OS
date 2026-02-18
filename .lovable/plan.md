
# Fix: Quick Start Not Skipping OOBE

## Problem
When users check "Quick start" on the disclaimer screen, it skips the installer wizard but still forces them through the full OOBE (Out of Box Experience) setup. The quick start should skip both.

## What Happens Now
1. User checks "Quick start" on the disclaimer
2. Disclaimer creates a default admin account and marks installation as done
3. User goes through boot, then auto-login (no `urbanshade_first_boot` flag set, so they see login screen)
4. After login, OOBE shows because `urbanshade_oobe_complete` is never set

## The Fix
In `src/pages/Index.tsx`, inside the `skipInstall` block (around line 715-733), add:
- Set `urbanshade_oobe_complete` to `"true"` in localStorage
- Set `oobeComplete` state to `true`
- Set `urbanshade_first_boot` to `"true"` so the login screen is also skipped on first boot
- Create a default user account so the system has someone to log in as
- Set `urbanshade_tour_completed` to `"true"` to also skip the welcome modal

This way, "Quick Start" truly means quick -- disclaimer, boot, straight to desktop.

## Technical Details

**File: `src/pages/Index.tsx`** (lines ~715-733)

Add to the `if (skipInstall)` block:
- `localStorage.setItem("urbanshade_oobe_complete", "true")` + `setOobeComplete(true)`
- `localStorage.setItem("urbanshade_first_boot", "true")` (auto-login after boot)
- `localStorage.setItem("urbanshade_tour_completed", "true")` (skip welcome modal)
- Create a default user account in `urbanshade_accounts` with username "Admin"
- `localStorage.setItem("urbanshade_install_type", "standard")` (default install type)

Single file change, no new dependencies.
