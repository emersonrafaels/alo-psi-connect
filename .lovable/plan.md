

## Plano: Corrigir Flash de Cores Antigas no Carregamento

### Diagnóstico

Quando você acessa a página, ocorre um "flash" visual porque:

| Etapa | O que acontece | Cores visíveis |
|-------|----------------|----------------|
| 1. HTML carrega | CSS é aplicado | Azul (fallback antigo do CSS) |
| 2. React inicia | TenantContext busca dados | Azul ainda visível |
| 3. Dados chegam | `applyTenantTheme()` executa | Roxo (cores corretas) |

**O problema**: As cores CSS padrão no `index.css` ainda são do "Alô Psi" antigo (azul `217 91% 21%`), mas a marca atual "Rede Bem Estar" usa roxo (`#5b218e`).

### Dados Atuais no Banco

| Tenant | Primary Color | Accent Color |
|--------|---------------|--------------|
| alopsi (Rede Bem Estar) | `#5b218e` (roxo) | `#e281bb` (rosa) |
| medcos | `#4fb828` (verde) | `#041d81` (azul) |

### Soluções

#### Opção 1: Atualizar CSS Fallbacks (Recomendada)
Alterar os fallbacks no CSS para as cores atuais da Rede Bem Estar, já que é o tenant padrão.

#### Opção 2: Ocultar UI Durante Loading
Mostrar uma tela de loading até o tenant estar carregado.

**Vou implementar a Opção 1** pois é mais simples e evita delay perceptível ao usuário.

### Mudanças Técnicas

**Arquivo:** `src/index.css`

Atualizar as variáveis CSS padrão (linhas 24-35 e 117-127) para usar as cores atuais da Rede Bem Estar:

| Variável | Valor Atual (Errado) | Novo Valor (Correto) |
|----------|---------------------|----------------------|
| `--primary` fallback | `217 91% 21%` (azul) | `280 63% 33%` (roxo #5b218e) |
| `--accent` fallback | `199 89% 48%` (ciano) | `330 62% 70%` (rosa #e281bb) |
| `--ring` | `217 91% 21%` | `280 63% 33%` |
| `--hover-bg` | `217 91% 95%` | `280 63% 95%` |
| `--hover-text` | `217 91% 21%` | `280 63% 33%` |

#### Conversão HEX para HSL

- `#5b218e` → `280 63% 34%` (roxo primário)
- `#e281bb` → `330 62% 70%` (rosa accent)

### Código Proposto

**Linhas 24-35 do index.css (light mode):**
```css
/* Rede Bem Estar Brand Colors (default tenant) */
--primary: var(--primary-light, 280 63% 34%); /* Roxo - usar valores do tenant quando disponíveis */
--primary-foreground: var(--primary-foreground-light, 0 0% 100%);

--accent: var(--accent-light, 330 62% 70%); /* Rosa - usar valores do tenant quando disponíveis */
--accent-foreground: var(--accent-foreground-light, 0 0% 100%);
```

**Linha 48:**
```css
--ring: 280 63% 34%;
```

**Linhas 52-54:**
```css
/* Hover states for better contrast */
--hover-bg: 280 63% 95%; /* Light purple for hover */
--hover-text: 280 63% 34%; /* Purple for hover text */
```

**Linhas 117-127 do index.css (dark mode):**
```css
--primary: var(--primary-dark, 280 63% 34%); /* Roxo primário dark mode */
--primary-foreground: var(--primary-foreground-dark, 210 40% 98%);

--accent: var(--accent-dark, 330 62% 70%); /* Rosa dark mode */
--accent-foreground: var(--accent-foreground-dark, 0 0% 100%);
```

### Resumo das Alterações

| Arquivo | Linhas | Tipo | Descrição |
|---------|--------|------|-----------|
| `src/index.css` | 24-35 | Modificar | Atualizar fallbacks light mode para roxo/rosa |
| `src/index.css` | 48 | Modificar | Atualizar --ring para roxo |
| `src/index.css` | 52-54 | Modificar | Atualizar hover states para roxo |
| `src/index.css` | 117-127 | Modificar | Atualizar fallbacks dark mode para roxo/rosa |

### Resultado Esperado

- **Antes**: Flash de azul → roxo ao carregar
- **Depois**: Cores roxas desde o primeiro frame

### Benefícios

- Zero flash visual no carregamento
- Cores corretas da Rede Bem Estar como padrão
- Medcos continuará funcionando normalmente (cores são sobrescritas pelo `applyTenantTheme`)
- Sem delay adicional de loading

