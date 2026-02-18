

## Permitir que a Instituicao use as Notas

### Contexto

As notas institucionais ja existem no sistema (tabela `institution_notes` e componente `InstitutionNotesTab`), mas atualmente so admins podem acessar. A instituicao (role `institution_admin`) precisa ver e gerenciar essas notas no seu portal em `/portal-institucional`.

### Mudancas necessarias

**1. Nova politica RLS no banco de dados**

Adicionar politica que permite institution_admins fazerem CRUD nas notas da sua propria instituicao:

```sql
CREATE POLICY "Institution admins can manage their notes"
ON public.institution_notes
FOR ALL
USING (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
)
WITH CHECK (
  institution_id IN (
    SELECT iu.institution_id FROM institution_users iu
    WHERE iu.user_id = auth.uid() AND iu.is_active = true
  )
);
```

Isso permite que o admin institucional crie, edite, exclua e visualize notas apenas da sua instituicao.

**2. Nova aba "Notas" no `InstitutionPortal.tsx`**

- Adicionar uma 6a aba com icone `StickyNote` e label "Notas"
- Reutilizar o componente `InstitutionNotesTab` ja existente, passando o `institutionId` da instituicao do usuario
- Atualizar o grid do TabsList de 5 para 6 colunas (em desktop)

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| Migration SQL | Adicionar politica RLS para institution_admins |
| `src/pages/InstitutionPortal.tsx` | Adicionar aba "Notas" com `InstitutionNotesTab` |

