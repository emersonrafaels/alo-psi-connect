# Nova Visão Geral do Portal Institucional — estilo painel executivo

## O que muda para o usuário
A Visão Geral deixa de ser uma pilha de cards genéricos e passa a ser um painel executivo focado nos números principais.

```text
+--------------------------------------------------------------+
| Faixa de destaque (roxo da marca)                            |
|  Boa tarde, Jayme · Afya              [data de hoje]         |
|  2.806  alunos vinculados     (número-chave grande)          |
|  1.769 ativos · 63% de atividade  [barra de progresso]       |
+--------------------------------------------------------------+
| Alunos ativos | Profissionais | Taxa de atividade | Apoios    |
|  número grande, legenda curta, link "Ver detalhes ->"        |
+--------------------------------------------------------------+
```

- **Faixa de destaque**: saudação com o primeiro nome (não mais "Professor"), nome da instituição, data, e o total de alunos como número-chave em tipografia grande, com barra mostrando a proporção de ativos.
- **Linha de números principais**: 4 indicadores com mesmo peso visual — Alunos ativos, Profissionais ativos (de X vinculados), Taxa de atividade, Apoios. Cada um clicável para a página correspondente.
- **Removidos**: card "Instituições" (pouco útil), os dois cards grandes "Gerenciar Profissionais/Alunos" (duplicam o menu lateral) e o WelcomeCard antigo (absorvido pela faixa).
- O cabeçalho executivo atual (`InstitutionExecutiveHeader`) é mantido abaixo dos números, para não perder informações existentes.
- Carregamento com barras de esqueleto no lugar dos números; hover dos cards preservado.

## Detalhes técnicos
- Novo componente `src/features/institution/portal/OverviewDashboard.tsx` recebendo os dados já calculados em `InstitutionPortal.tsx` (linkedStudents, activeStudents, linkedProfessionals, activeProfessionals, nome da instituição, nome do usuário).
- `InstitutionPortal.tsx`: substituir o conteúdo do `TabsContent value="overview"` (linhas ~199–350) pelo novo componente.
- Cores apenas via tokens semânticos (primary, muted, gradiente da marca em `index.css`); números com `tabular-nums`; layout 1 coluna no celular, 2 em tablet, 4 no desktop.
- Nenhuma mudança em dados, consultas ou permissões.
