

# Plan: Style the Ban Appeal Email

## Current State
The appeal email is plain text with ASCII-art borders (`#---#`, `|`). It works but looks unprofessional in an inbox.

## Change
Switch from `text` to `html` in the Resend API call, using a styled HTML email template. The design will match UrbanShade's dark/red aesthetic:

- Dark background with a red accent header ("BAN APPEAL REQUEST")
- Clean sections for username, appeal message, agreement clause, and ban details
- Monospace font for the OS terminal feel
- Proper escaping of user input to prevent HTML injection

### File: `supabase/functions/send-appeal/index.ts`
- Replace the `emailBody` plain text with an HTML template string
- Add a helper to escape HTML entities in user input (`<`, `>`, `&`, `"`, `'`)
- Change the Resend payload from `text: emailBody` to `html: emailHtml`
- Keep `subject` the same

The HTML email will have:
- A dark (`#1a1a2e`) outer container
- A red (`#dc2626`) header bar with "BAN APPEAL REQUEST" title
- Sections with subtle borders for: User, Appeal Message, Agreement, Ban Details
- White/light gray text on dark backgrounds
- Inline CSS only (email client compatibility)

