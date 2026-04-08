

## Combobox com sugestões para Instituição e Curso na Formação Acadêmica

### Resumo
Substituir os inputs de texto livre de Instituição e Curso por comboboxes que oferecem sugestões pré-definidas, mas permitem digitação livre (o usuário pode escolher da lista ou digitar qualquer valor).

### Alterações em `src/components/register/EducationStep.tsx`

1. **Criar listas de sugestões** dentro do componente:
   - `INSTITUTIONS`: principais universidades de saúde do Brasil (USP, UNICAMP, UFRJ, UFMG, UNIFESP, UNESP, UERJ, UFBA, UFPR, UFRGS, UnB, UFC, UFPE, UFSC, PUC-SP, PUC-RJ, PUC-MG, Mackenzie, Albert Einstein, Sírio-Libanês, etc.)
   - `COURSES`: cursos da área da saúde (Psicologia, Medicina, Enfermagem, Fisioterapia, Nutrição, Fonoaudiologia, Terapia Ocupacional, Farmácia, Biomedicina, Serviço Social, Educação Física, Odontologia, etc.)

2. **Criar componente interno `CreatableCombobox`** (ou inline) que:
   - Usa o padrão `Command` + `Popover` existente no projeto (como o `Combobox.tsx`)
   - Filtra as opções conforme o usuário digita
   - Se o texto digitado não corresponde a nenhuma opção, mostra uma opção "Usar: {texto digitado}" para permitir valor livre
   - Ao selecionar uma opção (pré-definida ou livre), seta o valor no state

3. **Substituir** os dois `<Input>` (instituição e curso) pelos novos comboboxes

### Arquivo impactado
- `src/components/register/EducationStep.tsx` — único arquivo alterado

