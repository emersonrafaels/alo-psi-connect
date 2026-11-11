# Admin rules
- Staff profiles `admin_rbe` and `clinical_coordinator`: page access lives in `src/features/admin/rolePermissions.ts`; in the database `has_role(...,'admin')` includes `admin_rbe`, technical tables (settings, emails, translations) use `is_technical_admin`, and clinical tables use `is_clinical_staff`, so one matrix drives the menu and the database enforces it.
