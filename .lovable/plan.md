

## Refinamento da Página "Sobre" — Aderência ao Manual de Marca

### Resumo
Refinar toda a página About.tsx para refletir o posicionamento institucional, paleta de cores, linguagem e padrão visual da Rede Bem-Estar conforme o manual de marca.

---

### Alterações por seção

**1. Hero — Ajustar textos e CTAs**
- Subtítulo: trocar para "Integramos suporte individual, leitura coletiva e dados institucionais para acompanhar a saúde emocional ao longo do tempo."
- CTA primário: "Conhecer a solução" (substituir "Conhecer a plataforma")
- CTA secundário: "Falar com a equipe" (substituir "Sou uma instituição")
- Adicionar formas orgânicas SVG mais suaves no fundo (curvas fluidas em vez de apenas círculos)
- Aplicar cores do manual: Deep Care Purple, Soft Empathy Pink, Calm Mint

**2. Manifesto — Destacar "acompanhar"**
- Adicionar destaque sutil (italic + underline decorativo) na palavra "acompanhar"
- Aumentar espaço em branco ao redor (py-32)
- Fundo Balance White (#F4F4F4) em vez de primary/5

**3. Para Quem É — Refinamento de linguagem**
- Manter estrutura, refinar textos para evitar linguagem de marketplace
- Aplicar cores do manual nos border-top (roxo, rosa, verde-água)

**4. Como Estruturamos o Cuidado — Refinamento visual**
- Usar cores alternadas do manual (roxo, rosa, verde-água) nos ícones
- Refinar textos para linguagem RBE (evitar "atendimento", usar "acompanhamento")

**5. Diferenciais — Aplicar paleta e tom**
- Aplicar hover com cores do manual
- Refinar linguagem: "Agilidade no acesso" → "Continuidade no acesso"

**6. Dados — Atualizar textos conforme briefing**
- Subtítulo: "Leituras agregadas que ajudam instituições a identificar padrões, antecipar riscos e agir com mais precisão"
- Adicionar frase: "Permite sair de decisões reativas para uma gestão contínua do bem-estar"
- CTA: manter "Solicitar demonstração"

**7. Governança — Atualizar título**
- Título: "Base clínica, ética e de privacidade" (conforme briefing item 12)
- Tom discreto e institucional mantido

**8. Time — Reduzir aparência marketplace**
- Título: "Equipe clínica e operação dedicada ao contexto acadêmico"
- Subtítulo: "Profissionais selecionados, supervisionados e alinhados às demandas do ambiente universitário"
- Remover badges de especialidade dos cards (reduz aparência marketplace)
- Simplificar cards: avatar + nome + profissão + bio curta apenas

**9. FAQ — Ajustar linguagem**
- Substituir "agendar" → "iniciar acompanhamento"
- Substituir "atendimento" → "acompanhamento" nos textos das respostas
- Remover pergunta "Como faço para agendar?" ou reformular para "Como inicio meu acompanhamento?"

**10. Pattern visual e fundos**
- Adicionar divisores orgânicos SVG entre seções (ondas suaves)
- Fundo das seções alternando entre branco (#F4F4F4) e transparente
- Remover bg-muted/30 e bg-muted/50, usar cores do manual

**11. Tipografia e espaçamento**
- Garantir font-family Inter em todos os títulos
- Aumentar espaçamento entre seções (py-24 mínimo para RBE)
- Títulos mais respiráveis (tracking-tight, leading-snug)

---

### Arquivo editado
- `src/pages/About.tsx` — refatoração completa do conteúdo RBE

### Nota sobre a Governança
O briefing pede "Base clínica, ética e de privacidade" (item 12), mas a memória de marca diz "Base clínica, ética e privacidade" (sem "de"). Seguirei a memória de marca que é a referência mais recente.

