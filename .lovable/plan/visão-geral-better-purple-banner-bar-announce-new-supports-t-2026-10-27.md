# Visão Geral: better purple-banner bar + announce new supports to students

## 1. Purple banner bar (replace "2.806 ativos / 100% de atividade")
Today it repeats "linked students" as "active", so it is always 100%. Replace it with real weekly engagement, the same number the "Reengajar alunos" action already uses:
- Left: "N alunos engajados nos últimos 7 dias" (used diary, practices, scales or meetings).
- Right: "X% de engajamento", with the bar filled to X%.
- No data yet: "Sem atividade registrada nesta semana".

The "Alunos ativos" card below stays as is.

## 2. Announce a support when it is turned on
When the institution turns on a support (from the catalog, or by switching a hidden support back to visible), a "Divulgar para os alunos?" window opens:
- The message is already filled in with the support's name, a short description and a "Ver apoio" link. You can edit it.
- Who gets it: all students (default), or pick units, courses, shifts or classes, the same choices as in Mensagens.
- "Também enviar por e-mail" box, ticked by default.
- Buttons: "Divulgar" and "Agora não".
- The "Divulgar um apoio" button in "O que fazer agora" opens Apoios with this window ready. You pick the support, then edit the message and send it.

The rules stay the same as in Mensagens: each student gets a private conversation, and demonstration students only get emails if their emails were turned on.

## Technical details
- `OverviewDashboard.tsx`: take `activeStudentsWeek`/`engagementRate` from the wellbeing summary already loaded in `InstitutionExecutiveHeader` (pass as props).
- New `AnnounceSupportDialog` in `src/features/messaging/`, reusing Composer's audience picker; sends via existing `send-message` function (kind `students`/`units`). No schema change.
- Hook `useInstitutionSupportsManager`: `addFromCatalog` / `togglePublished(true)` return the support so the page opens the dialog.
- Engagement action target -> `/portal-institucional/apoios?divulgar=1`.
