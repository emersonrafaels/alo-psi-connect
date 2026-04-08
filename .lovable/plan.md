

## Redesign da pagina /sobre baseado no HTML exportado do Stitch

### Objetivo
Reescrever `src/pages/About.tsx` para replicar fielmente o layout do HTML do Stitch (Produto & SaaS V2), mantendo toda a logica de tenant existente.

### Secoes do novo layout (baseado no HTML de referencia)

1. **Hero** — Fundo limpo (sem gradiente pesado), texto grande a esquerda com headline "Inteligencia emocional a servico da educacao", subtitulo, e badges "Dados Longitudinais" + "Privacidade Garantida". Sem imagem a direita, sem mockup card.

2. **Por que existimos** — Grid 2 colunas: imagem placeholder a esquerda (rounded-3xl com overlay gradient), texto a direita com titulo, paragrafo, e 2 items com icone (Monitoramento Preventivo, Literacia Emocional).

3. **Nossa Identidade (Bento Grid)** — Layout assimetrico: card grande 2x2 "Especialistas de Alma" com texto, card "50k+ Vidas impactadas" em roxo, card "Pedagogia" em teal, card "Tecnologia" em cinza.

4. **Engenharia do Cuidado (Modulos)** — 3 cards modulares: Diario de Emocoes (com barra de progresso), Escalas Cientificas (com barras visuais), Capsulas de Resiliencia (com play button). Labels "Module 01/02/03".

5. **Nossa Meta (Dados)** — Fundo roxo escuro (primary), texto branco, metricas "98% Acuracia" e "15min Tempo Medio", imagem de dashboard a direita. Integrar botao "Ver exemplo de painel" com InstitutionalDashboardModal.

6. **Instituicoes parceiras** — Logos placeholder em texto (EDUTECH.CO, GLOBAL_LEARN, etc.) em grayscale.

7. **CTA Final** — Card arredondado com borda gradient top, titulo "Pronto para humanizar sua gestao?", dois botoes: "Solicitar Demonstracao" e "Baixar PDF Metodologico".

### Secoes removidas vs atual
- Remover: "Para Quem E", "Nossa Filosofia", "Diferenciais", "Governanca" (simplificar)
- Manter: TeamSection (equipe), FAQ, InstitutionalDashboardModal
- A branch `medcos` (non-RBE) mantem layout simplificado atual

### Mudancas visuais principais
- Tipografia: usar `font-['Plus_Jakarta_Sans']` para headlines, corpo em sans padrao
- Cores: `#420073` (primary deep), `#5B218E` (primary-container), `#29676c` (secondary/teal), `#f9f9f9` (background)
- Cards: `rounded-3xl`, `cloud-shadow` (box-shadow: 0 12px 40px -4px rgba(26,28,28,0.06))
- Sem borders explicitas (usar tonal layering conforme DESIGN.md)
- Secoes com backgrounds alternados: `#f9f9f9`, `#f3f3f3`, `#ffffff`, `#420073`

### Preservacoes
- Logica tenant (isRedeBemEstar / medcos)
- InstitutionalDashboardModal
- TeamSection com fetch de profissionais
- FAQ Accordion
- Header / Footer
- Navegacao com rotas reais
- Scroll-to-top useEffect

### Arquivo afetado
- `src/pages/About.tsx` — reescrita completa (~750 linhas)

