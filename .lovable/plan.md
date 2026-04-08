

## Redesign da Pagina /sobre — Direcao Produto & SaaS (V2)

### Conceito
Transformar a pagina Sobre de um layout institucional-editorial para um design limpo e modular no estilo SaaS, que destaque a inteligencia funcional da plataforma mantendo tom caloroso e inclusivo. Inspirado na direcao "Produto & SaaS (V2)" do Stitch.

---

### Estrutura final (secoes)

1. **Hero** — Layout limpo, texto a esquerda + ilustracao/mockup a direita. Fundo gradiente suave (nao full-purple como atual). Tipografia Plus Jakarta Sans. CTAs com contraste claro.

2. **Por Que Existimos** — Nova secao narrativa com texto curto e emocional sobre a origem da RBE. Fundo branco, grande respiro. Substitui o "Manifesto" atual (que e muito editorial).

3. **Modulos da Plataforma** — Nova secao central com 3 cards modulares destacando funcionalidades: Diario Emocional, Escuta Profissional, Recursos e Trilhas. Cada card com icone, titulo, descricao curta e link para a feature. Visual de "produto".

4. **Nossa Filosofia** — 4 pilares do cuidado em grid clean (substitui "Como estruturamos o cuidado"). Remover numeracao/timeline, usar cards horizontais com icone + texto.

5. **Para Quem E** — Manter 3 cards (Estudantes, Docentes, Instituicoes). Remover imagens Unsplash, usar icones + fundo suave colorido. Mais limpo e modular.

6. **Dados e Inteligencia** — Manter secao de dados com metricas e botao "Ver exemplo de painel". Simplificar layout — remover imagem Unsplash decorativa. Foco nos numeros e CTA.

7. **Diferenciais** — Manter grid 3x2 mas com visual mais limpo (cards com borda fina, sem hover pesado).

8. **Governanca** — Manter compacto, 2x2 grid.

9. **Equipe** — Manter TeamSection existente.

10. **FAQ** — Manter Accordion existente.

11. **CTA Final** — Fundo gradiente suave (nao full-purple). Texto caloroso: "Vamos cuidar juntos". Botoes visiveis.

---

### Mudancas visuais principais

- **Hero**: Fundo `bg-gradient-to-br from-[#5B218E] via-[#5B218E]/85 to-[#97D3D9]/30` (mais suave, com toque mint). Remover formas organicas SVG pesadas. Manter imagem a direita mas com mockup mais clean.
- **Remover WaveDividers** entre todas as secoes — substituir por espacamento generoso e backgrounds alternados (#FFF / #F4F4F4).
- **Cards**: Borda fina, sombra suave, cantos arredondados (rounded-2xl). Sem hover-scale.
- **Tipografia**: Manter font-sans (ja configurado). Titulos mais leves (font-semibold em vez de font-bold em subtitulos).
- **Nova secao "Modulos"**: 3 cards com icone grande, titulo, descricao e botao "Explorar" que linka para /diario-emocional, /profissionais, /encontros.
- **Cores**: Manter paleta existente mas com uso mais contido — roxo para acentos, backgrounds predominantemente brancos/cinza claro.

### Preservacoes
- Toda a logica de tenant (isRedeBemEstar / medcos)
- InstitutionalDashboardModal
- TeamSection com fetch de profissionais
- Navegacao (Header/Footer)
- FAQ content
- Rotas reais em todos os links

### Arquivo afetado
- `src/pages/About.tsx` — reescrita completa (~650 linhas)

