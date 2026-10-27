# New workshops and rodas de conversa on /encontros

Today Alo Psi has only one meeting between now and early January. This adds 8 new meetings from November to mid-December 2026.

## Workshops (90 min, 30 spots)
1. Organizando a rotina sem culpa (Nov 5, 19h)
2. Respiração e regulação emocional na prática (Nov 12, 19h, with Libras)
3. Comunicação não violenta no dia a dia (Nov 26, 19h)
4. Planejando o próximo ano com equilíbrio (Dec 10, 19h)

## Rodas de conversa (60 min, 20 spots)
1. Solidão e pertencimento (Nov 7, 18h30)
2. Ansiedade antes das provas finais (Nov 19, 18h30, with Libras)
3. Relações familiares e limites (Dec 3, 18h30)
4. Fechando ciclos: como foi o seu ano? (Dec 17, 18h30)

## Rules for all 8
- Free and open to everyone, organized by Rede Bem-Estar, with status "scheduled".
- Each has a short welcoming description and topic tags, in the platform's tone ("cuidado", "acompanhamento").
- Meeting and WhatsApp links are left empty. Admins fill them in later, and the join button only unlocks 15 minutes before the start.

## Technical details
- Insert 8 rows into `group_sessions` with run_sql: Alo Psi tenant_id, `organizer_type='tenant'`, `audience_type='all'`, `is_free=true`, `current_registrations=0`. No schema change.
- Then check that /encontros lists them.
