

## Corrigir busca de instituicoes no cadastro de paciente

### Problema

O componente `InstitutionSelector` passa o UUID da instituicao como `value` para o `Combobox`. A biblioteca `cmdk` filtra os itens comparando o texto digitado com o `value` de cada `CommandItem`. Como o `value` e um UUID (ex: `a1b2c3d4-...`), digitar o nome da instituicao nunca encontra correspondencia.

### Causa raiz

Em `src/components/register/InstitutionSelector.tsx`, linha 37:

```typescript
value: inst.id, // UUID - cmdk filtra por este campo
label: inst.name,
// keywords NAO esta sendo passado
```

O componente `Combobox` ja suporta `keywords` (linha 24 e 94 do combobox.tsx), mas o `InstitutionSelector` nao usa essa propriedade.

### Correcao

**Arquivo: `src/components/register/InstitutionSelector.tsx`**

Adicionar `keywords: [inst.name]` ao mapeamento de opcoes para que o `cmdk` faca a busca pelo nome da instituicao:

```typescript
value: inst.id,
label: inst.name,
keywords: [inst.name],
badge: ( ... )
```

Isso faz com que o `cmdk` use o nome da instituicao para filtrar, mantendo o UUID como valor de selecao.

### Escopo

- 1 arquivo alterado: `src/components/register/InstitutionSelector.tsx`
- Alteracao de 1 linha (adicionar `keywords`)
- Sem impacto em outros componentes

