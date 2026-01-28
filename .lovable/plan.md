
## Plano: Aplicar Elementos Decorativos e UX do Brand Rede Bem Estar

### Resumo

Baseado no Brand Guide já analisado, vamos implementar os elementos visuais decorativos e melhorias de UX específicas para o tenant Rede Bem Estar (slug: `alopsi`).

---

### Elementos Já Implementados

| Elemento | Status |
|----------|--------|
| Logo e Favicon | ✅ Atualizado via S3 |
| Paleta de cores (Roxo, Rosa, Ciano) | ✅ Aplicado no banco |
| Cores do Header, Botões, Footer | ✅ Configurado |

---

### Elementos a Implementar

#### 1. Tipografia - Fonte para Títulos

O brand usa **Carbona** para headings. Como não está disponível gratuitamente, usaremos **Poppins** (Google Fonts) como alternativa similar:
- Geométrica, moderna e arredondada
- Boa legibilidade e personalidade semelhante

**Implementação:**
- Atualizar o campo `font_family_headings` no banco para `'Poppins'`
- Carregar a fonte via Google Fonts no `index.html`
- O sistema já aplica via CSS variable `--font-headings`

---

#### 2. Patterns Decorativos como Backgrounds

As imagens decorativas do brand podem ser usadas como backgrounds em seções específicas. URL base:
```
https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/brand/
```

**Seções para aplicar patterns:**
- Hero Section: Pattern sutil como overlay
- Seção CTA: Pattern de destaque
- Footer: Pattern decorativo

**Abordagem técnica:**
- Adicionar configuração em `theme_config` para URLs dos patterns
- Criar componente `BrandPattern` reutilizável
- Aplicar condicionalmente baseado no tenant

---

#### 3. Textos e Slogans do Brand

Atualizar os textos do Hero e CTAs com os slogans oficiais:

| Campo | Texto Atual | Texto do Brand |
|-------|-------------|----------------|
| `hero_title` | "Atendimento especializado..." | "Acolhimento muda trajetórias" |
| `hero_subtitle` | "Encontre profissionais..." | "Quando alguém escuta, tudo muda. Cuidar da mente também faz parte da jornada." |
| `cta_primary_text` | "Agendar Consulta" | "Encontrar Apoio" |

---

#### 4. Imagens do Hero e About

Atualizar as imagens do carousel com fotos no estilo do brand:
- Usar imagens do S3 path: `rede_bem_estar/imagens/`
- Cores e estilo alinhados com a paleta rosa/roxo/ciano

---

### Alterações Técnicas

#### Database (Tenant alopsi)

```sql
UPDATE tenants 
SET 
  -- Tipografia
  font_family_headings = 'Poppins',
  
  -- Textos do Brand
  hero_title = 'Acolhimento muda trajetórias',
  hero_subtitle = 'Quando alguém escuta, tudo muda. Cuidar da mente também faz parte da jornada.',
  cta_primary_text = 'Encontrar Apoio',
  
  -- Patterns decorativos no theme_config
  theme_config = jsonb_set(
    theme_config,
    '{brand_patterns}',
    '{"hero": "URL_PATTERN_HERO", "cta": "URL_PATTERN_CTA"}'
  )
WHERE slug = 'alopsi';
```

#### Código

1. **index.html**: Adicionar Google Font Poppins
2. **TenantContext.tsx**: Já aplica `--font-headings` dinamicamente
3. **index.css**: Usar `var(--font-headings)` nos elementos h1-h6
4. **Index.tsx**: Aplicar pattern decorativo condicionalmente no Hero
5. **Componente BrandPattern**: Novo componente para patterns de background

---

### Estrutura das Imagens no S3

Preciso confirmar quais arquivos estão disponíveis em:
```
s3://alopsi-website/rede_bem_estar/imagens/brand/
```

Possíveis arquivos (baseado no PDF):
- Pattern geométrico (linhas orgânicas rosa/ciano)
- Elementos decorativos para cards
- Backgrounds para seções

---

### Impacto

| Tenant | Afetado |
|--------|---------|
| **Rede Bem Estar** (alopsi) | ✅ Sim - Tipografia, textos e patterns |
| **MEDCOS** (medcos) | ❌ Não - Mantém configuração atual |

---

### Ordem de Implementação

1. **Tipografia**: Adicionar Poppins e aplicar nos headings
2. **Textos**: Atualizar hero_title, hero_subtitle e CTAs
3. **Patterns**: Implementar backgrounds decorativos nas seções
4. **Refinamentos**: Ajustar espaçamentos e animações

---

### Próximo Passo

Antes de implementar, preciso saber quais arquivos de imagem estão disponíveis no S3 para os patterns. Você pode me informar os nomes dos arquivos em `s3://alopsi-website/rede_bem_estar/imagens/brand/`?

Ou posso começar com a tipografia e textos enquanto você verifica as imagens.
