## Ban Screen: Logout + Appeal Email Buttons

### Changes to `src/components/BannedScreen.tsx`

**1. Logout Button**

- Add a "Sign Out" button at the bottom of the ban screen
- Import `supabase` from `@/integrations/supabase/client`
- Calls `supabase.auth.signOut()` which signs the user out (ban stays on the account)
- Styled as a subtle white outline button to match the minimal design

**2. Appeal Request Button**

- Add a "Request Appeal" button that opens a `mailto:` link to `emailbot00noreply@gmail.com`
- The email will be pre-filled with:
  - Subject: "Ban Appeal Request"
  - Body: includes the ban reason and status so the user doesn't have to type it manually
- Uses `window.location.href = mailto:...` with encoded subject/body

**Layout** -- both buttons sit below the contact info, left-aligned, stacked vertically with a small gap. White outline style, no flashy colors.

### Technical Details


| Detail        | Value                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| File          | `src/components/BannedScreen.tsx`                                          |
| New imports   | `supabase` from client, `LogOut` icon from lucide                          |
| Props change  | Add optional `onLogout` callback (or handle directly via supabase signOut) |
| New buttons   | "Sign Out" and "Request Appeal"                                            |
| mailto format | `mailto:emailbot00noreply@gmail.com?subject=Ban%20Appeal&body=Reason:...`  |


No new dependencies. No version bump needed (already part of the current redesign).  
  
Email template (keep exact):  
#------------------------------------------------#  
| Unban request from user:  
| (username)  
#------------------------------------------------#  
| Unban reason:  
| Write reason here.  
#------------------------------------------------#  
|  
|By writing this email i agree to not break the rules again,  
|and i lose y right to appeal again.  
|  
#------------------------------------------------#