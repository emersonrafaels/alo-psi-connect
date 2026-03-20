

## Corrigir Instituição de Ensino e Relação no Perfil do Paciente

### Problemas identificados

1. **Instituição de ensino mostra UUID**: O campo `instituicao_ensino` na tabela `pacientes` armazena o UUID da instituição (não o nome). O perfil exibe esse UUID diretamente.

2. **Relação vazia nos contatos**: O formulário de cadastro salva a relação como **label** (ex: "Pai/Mãe"), mas o Select no perfil usa **value** (ex: "pai_mae"). Os valores carregados do banco não correspondem a nenhuma opção do Select, então aparece vazio.

### Alterações

**`src/pages/Profile.tsx`**

1. **Resolver nome da instituição**: Na query de `fetchPatientData`, fazer um lookup em `educational_institutions` usando o UUID de `instituicao_ensino` para exibir o nome real.

```typescript
// Após buscar patientData, resolver nome da instituição
if (data?.instituicao_ensino) {
  const { data: inst } = await supabase
    .from('educational_institutions')
    .select('name')
    .eq('id', data.instituicao_ensino)
    .maybeSingle();
  if (inst) data.institution_name = inst.name;
}
```

Exibir `patientData.institution_name || patientData.instituicao_ensino` na UI.

2. **Corrigir relação nos contatos**: Ao carregar contatos do banco, fazer mapeamento reverso de label para value. Se o valor armazenado é "Pai/Mãe", converter para "pai_mae" para que o Select funcione. Se não encontrar match, manter o valor original (pode ser texto livre do campo "Outro").

```typescript
const labelToValue = (label: string) => {
  const found = relationOptions.find(o => o.label === label || o.value === label);
  return found?.value || label;
};
```

### Resumo
- 1 arquivo: `src/pages/Profile.tsx`
- 2 correções: lookup de nome da instituição + mapeamento de relação

