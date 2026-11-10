# Edge function rules
- Privileged edge functions (account creation, institution linking, test/seed tools) must verify the caller with `supabase/functions/_shared/require-admin.ts` before using the service client, and scheduled database jobs read their service key from Vault via `cron_service_key()`, so no endpoint trusts unauthenticated input and no key lives in SQL.
