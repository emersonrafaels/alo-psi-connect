# Configurar lembretes por email (Meu espaço do aluno)

## O que muda para o aluno
Ao clicar em "Lembretes por e-mail", abre um modal "Configurar lembretes" com:

1. **Ativar lembretes** (liga/desliga geral).
2. **Sobre o que lembrar** (marcar um ou mais):
   - Diário emocional parado
   - Radar de Permanência pendente no semestre
   - Encontros do dia
3. **Diário parado há quantos dias**: 1, 2, 3, 5 ou 7 dias (padrão 2).
4. **Recorrência**: Diário, 3x por semana (seg/qua/sex), Semanal (escolher o dia da semana).
5. **Horário preferido**: Manhã (9h), Tarde (14h) ou Noite (19h), horário de Brasília.
6. Prévia em texto: "Você receberá um email às segundas, às 9h, se houver algo pendente."
7. Botões Salvar / Cancelar. O card no Meu espaço passa a mostrar o resumo (ex.: "Semanal · seg · 9h") e um botão "Configurar".

Email só é enviado se houver algo pendente dentro dos tipos escolhidos; nada muda para quem não ativar.

## Detalhes técnicos
- Migração: em `profiles` adicionar `reminder_prefs jsonb` (types, frequency `daily|3x_week|weekly`, weekday, hour 9/14/19, diary_gap_days), com padrão equivalente ao comportamento atual. `email_reminders` continua sendo o opt-in.
- Novo `src/features/student-home/ReminderSettingsDialog.tsx`; `StudentHome.tsx` abre o modal no lugar do switch direto.
- `send-reminders/rules.ts`: funções puras `isDueNow(prefs, now)` (dia/hora em Brasília, evita duplicar no mesmo dia via `last_reminder_at`) e `buildReminders` filtrando por tipos e limite de dias.
- Agendamento da função passa de 1x/dia às 9h para 3x/dia (9h, 14h, 19h Brasília).
- Testes em `rules.test.ts`: semanal só no dia escolhido, 3x/semana só seg/qua/sex, horário respeitado, tipos desmarcados não aparecem, limite de dias do diário.
