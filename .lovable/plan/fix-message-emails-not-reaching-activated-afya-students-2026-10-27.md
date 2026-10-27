# Fix: message emails not reaching activated Afya students

## Cause (confirmed)
The last message (1 recipient, "send by email" ticked) went to Afya. Afya is marked as a demonstration institution, so the email step blocks every Afya recipient. It also blocks every study case outright, ignoring that Case A (dodagod127@hiringview.com) was activated with "Receber e-mails da plataforma" on. Result: notification created, zero emails sent, no error shown.

## Change
- In the send-message email step, decide per person:
  - Study case with emails turned on (Case A today) -> send.
  - Study case with emails off (B-F) -> never send.
  - Other students of a demonstration institution -> never send (unchanged).
- Show the sender how many emails went out ("E-mail enviado para N pessoas"), and a clear note when none were sent because recipients are demonstration accounts.
- Add a small test for the rule: activated case gets email, blocked cases and demo students don't.
- Redeploy and resend a test to Case A to confirm delivery in the logs.

## Technical details
- `supabase/functions/send-message/index.ts`: read `synthetic_student_cases(user_id, notifications_blocked)`; allowlist those with `notifications_blocked=false` even when `is_demo`; move the rule into a pure helper in `audience.ts` with a test.
- Composer toast uses returned `emailed`.
