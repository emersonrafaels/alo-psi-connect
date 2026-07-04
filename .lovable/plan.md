## Objetivo
Remover o card "Privacidade das respostas" da página `BuddyPortrait`, pois essa configuração agora vive na sessão dedicada de privacidade (`/buddy/privacidade`).

## Alterações

### `src/pages/buddy/BuddyPortrait.tsx`
1. **Remover uso do `PrivacyCard`** (linha ~104): eliminar a chamada `<PrivacyCard privacy={...} onChange={...} />` logo após o `ProgressHeader`.
2. **Remover o componente `PrivacyCard`** (linhas ~353-374): deletar toda a função `PrivacyCard`.
3. **Limpar import não utilizado**: remover `Lock` da lista de imports do Lucide.

## Escopo
- Apenas o arquivo `src/pages/buddy/BuddyPortrait.tsx`.
- Nenhuma mudança de comportamento ou lógica de dados — o campo `privacy` continua existindo no hook `useBuddyPortrait`, apenas deixa de ser editado dentro do Retrato.
- Nenhum impacto nas demais páginas do Buddy.