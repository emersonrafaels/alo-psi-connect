# Fix "Student profile not found" when linking students to an institution

## Cause (confirmed)
Emerson's account has a profile, but no student record. Linking to an institution needs that student record, so it fails. The automatic profile creation added earlier only creates the profile, not the student record. 57 student accounts are in the same situation.

## Fix
1. Create the missing student record for all 57 student accounts, including Emerson's.
2. Update the automatic account setup so every new student account also gets its student record, without ever blocking sign-up.
3. In the "Manage Institutions" window, create the student record on the spot if it is still missing, before linking, as a safety net.
4. Link Emerson to Afya again and confirm it shows as linked.

## Technical details
- Data fix: insert `pacientes (profile_id, tenant_id)` for `profiles.tipo_usuario='paciente'` lacking a row.
- Migration: extend `handle_new_user_profile` to insert into `pacientes` (ON CONFLICT DO NOTHING, inside the existing exception guard); also add a trigger on `profiles` when `tipo_usuario` becomes `paciente`.
- Frontend: in the link modal, upsert `pacientes` by `profile_id` before inserting `patient_institutions`.
