

## Adicionar opção "Outros" nos comboboxes de Instituição e Curso

### Alteração em `src/components/register/EducationStep.tsx`

No componente `CreatableCombobox`, adicionar:

1. **Novo state `isCustom`** — controla se o campo está no modo de digitação livre
2. **Opção fixa "Outros"** no final da lista do combobox — ao selecionar, fecha o popover e ativa o modo custom (`isCustom = true`)
3. **Quando `isCustom = true`**, renderizar um `Input` de texto livre em vez do botão do combobox, com um botão "Voltar para lista" para retornar ao combobox
4. O valor digitado no input é propagado via `onChange` normalmente

Isso substitui o comportamento atual de "Usar: ..." por uma UX mais explícita com a opção "Outros" visível na lista.

### Arquivo impactado
- `src/components/register/EducationStep.tsx`

