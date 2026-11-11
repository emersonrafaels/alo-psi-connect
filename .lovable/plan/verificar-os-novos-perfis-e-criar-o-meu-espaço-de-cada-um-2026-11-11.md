# Verificar os novos perfis e criar o Meu espaço de cada um

## O que você vai ver
**Meu espaço da Admin RBE** (ao entrar no site)
- Indicadores da rede: instituições ativas, alunos vinculados, profissionais ativos, agendamentos da semana, pedidos de apoio em aberto, triagens pendentes.
- "O que fazer agora": profissionais aguardando aprovação, agendamentos com pagamento pendente, pedidos de apoio sem resposta, triagens com sinal elevado.
- Atalhos para as páginas do painel que esse perfil pode abrir (sem Configurações, Emails e Traduções).
- Tour curto na primeira visita.

**Meu espaço da Coordenação clínica**
- Indicadores clínicos de todas as instituições: triagens pendentes, alunos com sinal elevado, pedidos de apoio abertos, retornos vencidos, Radar do semestre respondido.
- Lista por instituição (só números, alunos sempre como "Aluno #N"), com botão para abrir o Portal Institucional daquela instituição.
- "O que fazer agora": triagens urgentes, pedidos de apoio parados há mais de 3 dias, termos críticos novos.
- Atalhos só para Portal Institucional, Radar, Agendamentos e Palavras críticas. Tour curto.

## Verificação com contas de teste
1. Criar duas contas de teste (uma para cada perfil), marcadas como teste para não receber emails.
2. Entrar com cada uma no navegador e conferir:
   - Admin RBE: Configurações, Emails e Traduções não aparecem no menu e não abrem pelo endereço. As demais páginas abrem. Tentar salvar uma tradução falha.
   - Coordenação clínica: só vê as quatro páginas clínicas. Financeiro, Blog e Emails redirecionam. Consegue abrir uma instituição e uma triagem, e vê "Aluno #N".
   - Ambos: o Meu espaço certo aparece logo após entrar.
3. Corrigir o que falhar e enviar capturas de tela.
4. No final, remover as contas de teste (ou manter, se você preferir).

## Detalhes técnicos
- `StudentHome.tsx` escolhe `StaffHome` quando o usuário tem `admin_rbe` ou `clinical_coordinator` (antes da checagem de profissional).
- Novo `src/features/staff-home/` com `StaffHome.tsx`, `staffActions.ts` (regras puras e testadas) e números vindos de uma RPC agregada `get_staff_home_summary` (security definer, só para esses perfis e admins, retorna apenas contagens).
- Contas de teste criadas pela função de admin existente; login no Playwright via `lovable auth-session --user`.
