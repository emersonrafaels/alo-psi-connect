

## Unir etapas Formação + Resumo e remover referência de preço

### 1. Unir Step 4 (Formação) e Step 5 (Resumo) em uma única etapa

**Em `src/pages/register/ProfessionalForm.tsx`:**
- Alterar `totalSteps` de 9 para 8
- Combinar `renderStep4` e `renderStep5` em um único `renderStep4` que renderiza `EducationStep` + `ProfessionalSummaryField`
- Renumerar steps 6→5, 7→6, 8→7, 9→8
- Atualizar títulos do card header (remover "Resumo profissional", renomear step 4 para "Formação e Resumo")
- Atualizar `canProceedStep` validations (step 4 agora exige formações + resumo)
- Atualizar renderização condicional e lógica de navegação
- Atualizar `defaultTitles` no `TimelineProgress` (remover "Resumo" da lista)

### 2. Remover referência de mercado do PriceInput

**Em `src/components/register/PriceInput.tsx`:**
- Remover o bloco `bg-blue-50` com as 3 faixas de preço (Iniciante/Intermediário/Experiente)
- Manter apenas o Label e o Input de preço

### Arquivos impactados
- `src/pages/register/ProfessionalForm.tsx`
- `src/components/register/PriceInput.tsx`

