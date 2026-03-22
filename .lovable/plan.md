

## Refatoração completa da página Sobre — Rede Bem-Estar

### Escopo
Reorganizar a página About.tsx exclusivamente para o tenant "rede-bem-estar" (manter lógica condicional por `tenant?.slug`), alterando ordem das seções, textos, hierarquia visual e foco narrativo. Reutilizar todos os componentes existentes (Card, Button, Badge, Accordion, AboutImageSection, Avatar, etc.).

### Estrutura final das seções (nova ordem)

```text
1. HERO (reescrito)
2. MANIFESTO (novo — seção simples, sem componente novo)
3. PARA QUEM É (movido de seção 5 → 3, textos ajustados)
4. COMO ESTRUTURAMOS O CUIDADO (seção 3 reescrita)
5. DIFERENCIAIS (seção 6, textos ajustados)
6. DADOS (seção 7, expandida visualmente)
7. GOVERNANÇA (seção 4, reduzida)
8. TIME (seção 8, reduzido)
9. FAQ (mantido)
```

### Alterações detalhadas

**1. HERO**
- Título: "Bem-estar universitário com continuidade, contexto e inteligência"
- Subtítulo: texto institucional fornecido
- Remover `AboutImageSection` (imagem de estetoscópio) — substituir por composição abstrata com gradiente roxo + formas SVG orgânicas (circles/blobs com as cores da paleta)
- CTAs: "Conhecer a plataforma" (scroll to manifesto, `variant="default"`) + "Sou uma instituição" (`variant="outline"`, navega para `/contato`)
- Background: gradiente com roxo #5B218E base

**2. MANIFESTO (novo)**
- Seção minimalista centralizada com muito whitespace
- Título: "Cuidar não é intervir pontualmente. É acompanhar ao longo do tempo."
- Subtexto curto de 2-3 linhas
- Sem Card, sem ícone — apenas tipografia editorial (`py-24`, `max-w-3xl mx-auto text-center`)

**3. PARA QUEM É (subido)**
- Mesma estrutura de 3 Cards com ícones (GraduationCap, Users, Building2)
- Textos ajustados conforme briefing
- Título da seção mantido

**4. COMO ESTRUTURAMOS O CUIDADO (reescrito)**
- Título: "Como estruturamos o cuidado"
- 4 steps conceituais (não operacionais): Acompanhamento contínuo, Leitura de contexto, Apoio estruturado, Inteligência institucional
- Ícones: Heart, Eye, Users, BarChart3
- Layout mantido (timeline vertical com Cards)

**5. DIFERENCIAIS**
- Título: "Nossos Diferenciais"
- Trocar "Foco exclusivo em medicina" → "Especialização no contexto acadêmico"
- Ajustar descriptions para linguagem mais institucional

**6. DADOS (expandida)**
- Título: "Dados que ampliam a capacidade de cuidar"
- Subtítulo: "Leituras agregadas que ajudam instituições a agir com mais precisão"
- Mais padding (`py-28`), textos maiores
- Lista ajustada para linguagem estratégica
- Painel de exemplo mantido mas com mais destaque

**7. GOVERNANÇA (reduzida)**
- Título: "Base clínica, ética e de privacidade"
- Reduzir padding (`py-12`), texto menor
- Manter cards de credenciais mas menores
- Background mais sutil

**8. TIME (reduzido)**
- Título: "Equipe clínica e de operações"
- Subtítulo ajustado
- Reduzir de 6 para 4 profissionais (`useProfessionals(4)`)
- Menos padding

**9. FAQ** — Sem mudanças

### Direção visual
- Aplicar cores da paleta via classes Tailwind existentes (primary = roxo, accent = rosa/verde-água)
- Mais `py-24`/`py-28` nas seções importantes (Manifesto, Dados)
- Menos padding nas seções secundárias (Governança, Time)
- Uso de `font-light` e `tracking-wide` para estilo editorial no manifesto

### Arquivo alterado
- `src/pages/About.tsx` — uma única refatoração completa mantendo componentes importados

### Condicionais por tenant
- Envolver textos específicos com `tenant?.slug === 'rede-bem-estar'` para não afetar outros tenants (ex: medcos)
- Manter `getTenantName()` existente para textos compartilhados

