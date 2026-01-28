

## Plano: Melhorias de UX/UI para Rede Bem Estar

### Status Atual do Brand

| Implementado | Pendente |
|--------------|----------|
| ✅ Logo e Favicon | ⏳ Patterns decorativos como backgrounds |
| ✅ Paleta de cores (Roxo, Rosa, Ciano) | ⏳ Imagens do Hero alinhadas ao brand |
| ✅ Tipografia Poppins para headings | ⏳ Cards mais arredondados |
| ✅ Textos/slogans do brand | ⏳ Animações de entrada |

---

### Melhorias Propostas por Prioridade

#### 1. Homepage (Index.tsx) - Alta Prioridade

| Problema | Solução |
|----------|---------|
| Hero Section sem pattern decorativo | Adicionar background pattern sutil usando imagens do S3 |
| Cores hardcoded na seção "University" (#3b82f6, #10b981) | Usar cores do tenant (roxo, rosa, ciano) |
| Seção de vídeo com cores genéricas (teal-100) | Substituir por cores do brand (roxo/rosa) |
| Cards de estatísticas com emojis | Usar ícones Lucide mais profissionais |
| CTA Section básica | Adicionar pattern decorativo e melhorar visual |
| Botões duplicados no Hero ("Encontrar Profissional" e "Agendar Consulta" fazem a mesma coisa) | Diferenciar CTAs |

#### 2. Footer (footer.tsx) - Média Prioridade

| Problema | Solução |
|----------|---------|
| Background hardcoded `bg-gray-800` | Usar `hsl(var(--footer-bg))` dinâmico |
| Círculo decorativo genérico no rodapé | Substituir por logo ou pattern do brand |
| Copyright "Rede Bem-Estar" hardcoded | Usar nome dinâmico do tenant |

#### 3. Página de Contato (Contact.tsx) - Média Prioridade

| Problema | Solução |
|----------|---------|
| Informações de contato hardcoded (endereço, CNPJ) | Usar dados do tenant configurados no banco |
| Hero Section sem visual diferenciado | Adicionar gradiente com cores do brand |
| Seção sem ícones coloridos | Usar accent colors nos ícones |

#### 4. Search Section - Baixa Prioridade

| Problema | Solução |
|----------|---------|
| Emojis 🔵 nos labels | Usar ícones Lucide ou remover |
| Visual genérico | Adicionar subtle pattern de background |

#### 5. Cards de Profissionais - Baixa Prioridade

| Problema | Solução |
|----------|---------|
| Gradientes genéricos | Usar cores do tenant |
| Bordas não arredondadas o suficiente | Aumentar border-radius para 2xl |
| Indicador "online" genérico verde | Manter consistência com brand |

---

### Detalhes Técnicos

#### A. Corrigir Cores Hardcoded na Homepage

```tsx
// ANTES (Index.tsx - University Section)
stroke="#3b82f6" // Azul hardcoded
stroke="#10b981" // Verde hardcoded
className="bg-blue-500" // Azul hardcoded

// DEPOIS - Usar classes do tema
stroke="hsl(var(--primary))" // Roxo do tenant
stroke="hsl(var(--accent))"  // Rosa do tenant
className="bg-primary"
```

#### B. Footer Dinâmico

```tsx
// ANTES
<footer className="bg-gray-800 text-primary-foreground">

// DEPOIS
<footer style={{ 
  backgroundColor: 'hsl(var(--footer-bg))',
  color: 'hsl(var(--footer-text))'
}}>
```

#### C. Componente de Pattern Decorativo

Criar novo componente reutilizável:

```tsx
// components/BrandPattern.tsx
const BrandPattern = ({ variant = 'subtle' }) => {
  const { tenant } = useTenant();
  const patternUrl = tenant?.theme_config?.brand_patterns?.hero;
  
  if (!patternUrl) return null;
  
  return (
    <div 
      className="absolute inset-0 opacity-10 pointer-events-none"
      style={{ backgroundImage: `url(${patternUrl})` }}
    />
  );
};
```

---

### Animações e Microinterações

| Elemento | Animação Proposta |
|----------|-------------------|
| Cards de profissionais | `animate-fade-in` ao entrar na viewport |
| Seções da homepage | Scroll reveal suave |
| Botões CTA | `hover:scale-105` com transição |
| Cards de estatísticas | Hover lift `hover:-translate-y-1` |
| Hero text | Fade in sequencial com delay |

---

### Ordem de Implementação

1. **Footer dinâmico** - Corrigir uso de cores do tenant
2. **Homepage - Cores hardcoded** - Substituir azul/verde por roxo/rosa/ciano
3. **Homepage - Ícones** - Substituir emojis por Lucide icons
4. **Contato - Dados dinâmicos** - Usar dados do tenant
5. **Pattern decorativo** - Implementar backgrounds (requer imagens do S3)
6. **Animações** - Adicionar microinterações

---

### Impacto nos Tenants

| Tenant | Afetado |
|--------|---------|
| **Rede Bem Estar** (alopsi) | ✅ Melhorias visuais significativas |
| **MEDCOS** (medcos) | ✅ Beneficia das melhorias genéricas (mantém cores próprias) |

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Cores dinâmicas, ícones, animações |
| `src/components/ui/footer.tsx` | Cores dinâmicas, copyright dinâmico |
| `src/pages/Contact.tsx` | Dados do tenant, visual |
| `src/components/search-section.tsx` | Remover emojis, visual |
| `src/components/professional-card.tsx` | Border-radius, cores |
| `src/components/BrandPattern.tsx` | **Novo componente** |

---

### Pergunta Pendente

Para implementar os patterns decorativos, preciso saber os nomes dos arquivos de imagem disponíveis em:

```
s3://alopsi-website/rede_bem_estar/imagens/brand/
```

Posso começar com as correções de cores e animações enquanto você verifica os nomes das imagens.

