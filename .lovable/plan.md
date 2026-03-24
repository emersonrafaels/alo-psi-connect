

## Refatoracao completa da Homepage — Aderencia ao Manual de Marca RBE

### Resumo
Reescrever `src/pages/Index.tsx` para transformar a homepage de um site de servicos/marketplace em uma plataforma institucional de cuidado continuo, seguindo o mesmo padrao visual e de linguagem ja aplicado na pagina Sobre.

---

### Estrutura final da pagina (ordem das secoes)

1. **Hero** — fundo Deep Care Purple com formas organicas SVG
2. **Faixa de reforco** — metricas rapidas (big numbers)
3. **O Problema** — desafio do cuidado emocional na universidade
4. **Nossa Abordagem** — 4 pilares do cuidado estruturado
5. **Para Quem E** — estudantes, docentes, instituicoes
6. **Diferenciacao** — por que a RBE e diferente
7. **Dados** — inteligencia institucional
8. **Governanca** — base clinica, etica e privacidade
9. **Equipe** — profissionais em destaque (manter fetch existente, simplificar cards)
10. **Video** — manter iframe YouTube existente, contexto simplificado
11. **FAQ** — perguntas frequentes com linguagem RBE
12. **CTA Final** — "Vamos estruturar o cuidado na sua instituicao"

---

### Detalhes por secao

**1. Hero**
- Fundo: `bg-gradient-to-br from-[#5B218E] via-[#5B218E]/90 to-[#5B218E]/70` + formas organicas SVG (reutilizar padrao do About.tsx)
- Titulo: "Estruturando o cuidado emocional ao longo da jornada universitaria"
- Subtitulo: "Integramos suporte clinico, leitura de contexto e dados institucionais para acompanhar estudantes e fortalecer ambientes academicos."
- CTAs: "Conhecer a solucao" (primary) + "Falar com a equipe" (outline branco)
- Remover HeroCarousel — usar composicao clean com texto centralizado ou lado a lado com imagem decorativa

**2. Faixa de reforco (nova)**
- Fundo `bg-[#F4F4F4]`, 3 metricas lado a lado em big numbers
- "500+" Acompanhamentos | "30+" Profissionais | "96%" Satisfacao
- Frase: "Apoiando estudantes, docentes e instituicoes com cuidado continuo"

**3. O Problema (nova secao)**
- Titulo: "O desafio do cuidado emocional na universidade"
- 3-4 cards com icones (pressao constante, jornadas intensas, impacto acumulado, solucoes pontuais)
- Frase de fechamento: "O cuidado precisa ser continuo, contextual e estruturado"
- Substitui a secao "University Section" atual (83%, 53%, 1/3) — mantem dados mas recontextualiza

**4. Nossa Abordagem (nova secao)**
- Titulo: "Como estruturamos o cuidado"
- 4 blocos: Acompanhamento continuo, Leitura de contexto, Apoio estruturado, Inteligencia institucional
- Icones com cores alternadas do manual (roxo, rosa, verde-agua)

**5. Para Quem E (nova secao)**
- 3 cards: Estudantes, Docentes, Instituicoes
- Foco em beneficio continuo, nao acesso pontual
- Border-top com cores da paleta

**6. Diferenciacao (nova secao)**
- Titulo: "Por que a Rede Bem-Estar e diferente"
- 4 itens comparativos implicitos (vs clinicas, marketplaces, apps genericos)
- Reforcar: foco academico, continuidade, integracao institucional, dados

**7. Dados (nova secao)**
- Titulo: "Dados que ampliam a capacidade de cuidar"
- Subtitulo + bullets (padroes, temas recorrentes, risco antecipado, engajamento)
- CTA: "Ver exemplo de painel"

**8. Governanca (nova secao)**
- Titulo: "Base clinica, etica e privacidade"
- 4 itens: profissionais habilitados, protocolos, LGPD, anonimizacao
- Tom discreto e institucional

**9. Equipe (refatorar secao existente)**
- Titulo: "Equipe especializada no contexto academico"
- Manter fetch de profissionais em destaque
- Simplificar cards: remover badges de especialidade, foco em nome + profissao
- Manter ProfessionalCard mas com `isCompactView`

**10. Video (simplificar secao existente)**
- Manter iframe YouTube
- Remover os 3 cards de estatisticas (30+, 500+, 96%) — ja migrados para faixa de reforco
- Titulo: "Conhea mais sobre nosso trabalho"

**11. FAQ (nova secao)**
- 5-6 perguntas com linguagem RBE
- Usar Accordion (mesmo padrao do About)
- Substituir "agendar" por "iniciar acompanhamento"

**12. CTA Final**
- Titulo: "Vamos estruturar o cuidado na sua instituicao"
- Fundo Deep Care Purple
- Botoes: "Falar com a equipe" + "Agendar apresentacao"

---

### Remocoes
- SearchSection (barra de busca de profissionais — linguagem marketplace)
- Secao "About" generica (frase solta)
- Secao "University" com graficos circulares (dados migram para secao Problema)
- Cards de estatisticas duplicados na secao de video

### Componentes reutilizados
- `WaveDivider` do About.tsx — extrair ou duplicar
- `Accordion` para FAQ
- `ProfessionalCard` para equipe
- Paleta de cores hardcoded do manual

### Arquivo
- `src/pages/Index.tsx` — reescrita completa (~400 linhas)

