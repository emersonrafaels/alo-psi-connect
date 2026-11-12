# i18n rules

- Translate the UI to EN/ES only through `src/features/i18n/autoTranslate.ts` (DOM auto-translation via `translate-texts`, stored in `translations`/`translation_glossary`, where admin human reviews override automatic text) and mark untranslatable areas with `data-no-translate`, so pages stay authored in Portuguese without per-file string catalogs.
- Store each user's UI language in `profiles.preferred_language` (synced by `startProfileLangSync` in `autoTranslate.ts`) so the choice follows the account and reminder emails use it.
