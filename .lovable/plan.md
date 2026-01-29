

## Plano: Melhorar Disposição do Menu Hamburger Mobile

### Problema Atual

Analisando a imagem, identifico os seguintes problemas no header mobile:

1. **Logo e Menu juntos** - O ícone de menu (hamburger) fica muito próximo do logo, sem espaçamento adequado
2. **Falta de separação visual** - Não há separador entre os elementos do header
3. **Menu expandido sem organização clara** - Os itens do menu aparecem sem agrupamento visual

### Melhorias Propostas

| Aspecto | Atual | Proposto |
|---------|-------|----------|
| Posição do hamburger | Próximo ao logo | Extrema direita com `ml-auto` |
| Espaçamento header | Gap de 4 apenas | Gap + justify-between |
| Menu expandido | Lista simples | Seções agrupadas com separadores |
| Visual do botão | Sem estilo | Padding e área de toque maior |
| Animação | Sem transição | Fade/slide suave |

### Estrutura Visual Proposta

```text
+------------------------------------------+
| [LOGO]                        [≡ MENU]   |
+------------------------------------------+
|                                          |
| ---- Navegação ----                      |
|   Home                                   |
|   Sobre                                  |
|   Profissionais                          |
|   Encontros                              |
|   Diário Emocional                       |
|   Blog                                   |
|   Contato                                |
|                                          |
| ---- Minha Conta ----  (se logado)       |
|   📅 Meus Agendamentos                   |
|   👥 Meus Encontros                      |
|   ⚙️ Meu Perfil                          |
|                                          |
| ---- Ações ----                          |
|   [Tenant Switcher]    [🌙 Theme]        |
|   [Entrar]             [Cadastrar]       |
+------------------------------------------+
```

### Mudanças Técnicas

**Arquivo:** `src/components/ui/header.tsx`

#### 1. Header Row (linha ~279-285)
- Mover o botão hamburger para a extrema direita com `ml-auto`
- Aumentar área de toque para acessibilidade (44x44px mínimo)
- Adicionar padding e borda arredondada

#### 2. Menu Mobile Expandido (linhas ~287-438)
- Adicionar transição suave de abertura
- Organizar em seções com títulos:
  - "Navegação" - links principais
  - "Minha Conta" - links do usuário (quando logado)
  - "Ações" - botões, theme toggle, tenant switcher
- Usar grid 2 colunas para botões Entrar/Cadastrar
- Melhorar espaçamento entre itens

#### 3. Estilização Visual
- Fundo semi-transparente no menu expandido
- Ícones maiores nos links (h-5 w-5)
- Separadores visuais entre seções
- Border radius nas seções

### Código Proposto

**Botão Hamburger:**
```tsx
<button
  className="md:hidden ml-auto p-2 rounded-lg hover:bg-white/10 transition-colors"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
>
  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
</button>
```

**Menu Expandido com Seções:**
```tsx
{isMenuOpen && (
  <div className="md:hidden pb-6 animate-in fade-in slide-in-from-top-2 duration-200">
    {/* Seção: Navegação */}
    <div className="py-3">
      <p className="text-xs font-medium uppercase tracking-wider opacity-60 mb-3">
        Navegação
      </p>
      <nav className="flex flex-col space-y-1">
        {navigation.map(...)}
      </nav>
    </div>
    
    {/* Seção: Minha Conta (se logado) */}
    {user && (
      <div className="py-3 border-t border-white/10">
        <p className="text-xs font-medium uppercase tracking-wider opacity-60 mb-3">
          Minha Conta
        </p>
        {/* Links do usuário */}
      </div>
    )}
    
    {/* Seção: Ações */}
    <div className="pt-4 border-t border-white/10">
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Tenant Switcher */}
        {/* Theme Toggle */}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Botões Entrar/Cadastrar ou Sair */}
      </div>
    </div>
  </div>
)}
```

### Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/components/ui/header.tsx` | Modificar | Reestruturar menu mobile com seções organizadas |

### Benefícios

- Melhor hierarquia visual com seções organizadas
- Área de toque maior no botão hamburger (acessibilidade)
- Botões Entrar/Cadastrar lado a lado economizam espaço
- Animação suave de abertura melhora a experiência
- Separadores visuais facilitam navegação
- Menu mais limpo e profissional

