

## Melhorar página Sobre — imagens, UX/UI e cores de botões

### Problemas identificados

1. **Botão "Sou uma instituição"** tem texto branco invisível (border-primary-foreground/30 + text-primary-foreground no hero com fundo roxo — o outline não contrasta bem)
2. **Botão "Conhecer a plataforma"** com bg-background text-primary está pouco legível
3. **Página sem nenhuma imagem real** — apenas SVG abstratos e ícones
4. **Seções monótonas** — muitos cards iguais, pouca variação visual
5. **Manifesto sem impacto visual** — texto puro sem elemento de suporte

### Alterações em `src/pages/About.tsx`

**1. Corrigir cores dos botões do Hero**
- "Conhecer a plataforma": `bg-white text-[#5B218E] hover:bg-white/90 font-bold` (garantir contraste)
- "Sou uma instituição": `border-2 border-white text-white hover:bg-white/15 font-semibold` (borda mais forte, texto visível)

**2. Adicionar imagens via Unsplash nas seções**
- **Hero**: Adicionar imagem de estudantes universitários no lado direito (layout 2 colunas no desktop) — usar URL Unsplash de campus/estudantes com overlay
- **Manifesto**: Adicionar imagem sutil de fundo ou lateral de estudantes estudando
- **Dados**: Substituir ou complementar o painel ilustrativo com imagem de dashboard/reunião institucional
- **Para Quem É**: Adicionar imagens pequenas dentro dos cards (estudante, professor, prédio)

**3. Melhorar Hero — layout 2 colunas**
- Lado esquerdo: texto + CTAs (como está)
- Lado direito: imagem de contexto universitário com rounded corners, sombra e leve rotação/overlap decorativo
- Manter fundo roxo gradient com os blobs SVG

**4. Melhorar seção Manifesto**
- Adicionar borda lateral roxa decorativa (border-left) ou aspas grandes tipográficas
- Leve fundo `bg-primary/5` para destacar do branco puro

**5. Melhorar seção "Para Quem É"**
- Adicionar imagens Unsplash redondas/quadradas acima dos ícones nos cards
- Hover com scale mais pronunciado

**6. Melhorar seção "Como estruturamos"**
- Adicionar números grandes (01, 02, 03, 04) ao lado dos ícones na timeline
- Fundo alternado leve nos cards

**7. Melhorar seção Dados**
- Adicionar imagem de contexto ao lado do painel (laptop com dashboard, reunião)
- Botão "Solicitar demonstração" com cor primária sólida e texto branco visível

**8. Melhorar seção FAQ**
- Adicionar ilustração lateral ou ícone decorativo maior

### Imagens Unsplash (URLs diretas, gratuitas)
- Hero: `https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600` (estudantes campus)
- Manifesto: decorativo apenas
- Para Quem É - Estudantes: `https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400`
- Para Quem É - Docentes: `https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400`
- Para Quem É - Instituições: `https://images.unsplash.com/photo-1562774053-701939374585?w=400`

### Resumo
- 1 arquivo: `src/pages/About.tsx`
- Foco: contraste de botões, imagens reais, variação visual entre seções

