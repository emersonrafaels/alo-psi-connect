# Meu espaço da Coordenação clínica — nova versão

## Objetivo
Transformar a página numa central clínica: o que é urgente hoje, como está a saúde dos alunos em toda a rede e quais instituições precisam de atenção. Sempre com dados agregados e alunos como `Aluno #N`.

## Estrutura da página
1. **Cabeçalho**: saudação, data, "Atualizado agora" e botão "Abrir triagem".
2. **Faixa de prioridades (hoje)** — cards clicáveis com cor por gravidade:
   - Sinal elevado sem triagem
   - Triagens em aberto / com prioridade alta
   - Retornos vencidos
   - Pedidos de apoio parados há mais de 3 dias
   - Sinais textuais sensíveis nos últimos 7 dias (só a contagem, nunca o texto)
3. **Saúde da rede (últimos 30 dias vs. 30 anteriores)**:
   - Distribuição por nível: Sinal elevado, Alerta, Atenção, Sem sinais prioritários, Dados insuficientes (barra horizontal + %)
   - Médias de humor, ansiedade, sono e energia, com seta de tendência
   - Engajamento: % de alunos com registro no diário em 7 dias
4. **Fluxo de cuidado**: tempo médio até a triagem, tempo médio até a 1ª consulta, triagens resolvidas em 30 dias e desfechos.
5. **Ranking de instituições que precisam de atenção** (a lista atual, melhorada):
   - Colunas: alunos, % sinal elevado, triagens abertas, prioridade alta, retornos vencidos, pedidos parados, ponto de status colorido
   - Ordenado por um índice de prioridade, com a busca e o filtro já existentes, e o botão "Abrir"
   - Instituições com menos de 10 alunos aparecem sem percentuais
6. **Radar de Permanência do semestre**: % de alunos que responderam e as instituições com menor participação.
7. **Próximos 7 dias**: consultas agendadas e encontros com vagas.

Ficam de fora os atalhos (já removidos) e qualquer dado individual ou texto do diário.

## Detalhes técnicos
- Nova RPC `get_clinical_home_summary()` (security definer, só para `clinical_coordinator`/admins) que retorna os blocos acima em JSON, reutilizando `isAwaitingTriage`/regras de `signalRules` no SQL quando possível, `get_institution_critical_flags` para a contagem textual e ocultando percentuais de grupos com menos de 10.
- Lógica pura (índice de prioridade, tendências, faixas) em `src/features/staff-home/clinical/clinicalHomeLogic.ts` com testes Bun.
- Componente `ClinicalHome.tsx` em `src/features/staff-home/clinical/`, renderizado por `StaffHome` quando `kind === 'clinical'`; Admin RBE continua igual.
- Tour atualizado com as novas seções.
- Visual com tokens do tema, claro/escuro, ponto de status colorido (sem triângulos/barras empilhadas, conforme regra do projeto).
