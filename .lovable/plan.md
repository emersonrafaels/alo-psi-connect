## Remover seletor de "Padrão de respiração" da página de detalhe

O padrão de respiração é uma característica intrínseca de cada prática (definida em `padrao_respiracao` no banco), não uma escolha do usuário.

### Alterações

**`src/pages/praticas/PraticaDetalhe.tsx`**
- Remover o bloco UI "Padrão de respiração" (cards com `BREATHING_PRESETS`).
- Remover o state `presetId` e seu reset no `useEffect`.
- Remover o parâmetro `preset` da URL gerada em `iniciar()`.
- Remover imports não usados: `Wind`, `BREATHING_PRESETS`.

**`src/pages/praticas/PraticaSessao.tsx`** (verificação)
- Garantir que a sessão use sempre o `padrao_respiracao` da prática carregada do banco, ignorando qualquer `?preset=` legado na URL. Se hoje há fallback que lê `preset`, remover.

Nada muda no banco nem em outras práticas/áudios/temas.
