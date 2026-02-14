
## Exibir mensagem de responsavel no detalhe do encontro

### Problema

Quando o dono/criador do encontro visualiza a pagina de detalhes, o botao "Garantir Minha Vaga" aparece normalmente, o que nao faz sentido -- ele e o responsavel, nao um participante.

### Solucao

No arquivo `src/pages/GroupSessionDetail.tsx`, verificar se o usuario logado e o criador do encontro (`session.created_by === user?.id`) e, nesse caso, substituir o botao de inscricao por uma mensagem informativa.

### Detalhes tecnicos

**Arquivo: `src/pages/GroupSessionDetail.tsx`**

1. Criar variavel `isOwner`:
```typescript
const isOwner = user?.id && session.created_by === user.id;
```

2. No bloco do botao de inscricao (linhas ~226-244), adicionar condicional: se `isOwner`, renderizar uma mensagem estilizada ao inves do botao:
```tsx
{isOwner ? (
  <div className="w-full text-center p-4 rounded-md bg-primary/10 border border-primary/20">
    <p className="font-semibold text-primary text-sm">Voce e o responsavel por este encontro</p>
  </div>
) : (
  <Button ...>Garantir Minha Vaga / Ja Inscrito / etc</Button>
)}
```

3. Mudanca pontual, sem impacto em outras funcionalidades. A logica de share, calendario e whatsapp continua visivel para o dono.
