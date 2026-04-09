

## Melhorar alinhamento de Formação e Resumo (Step 4)

### Problema
As duas seções (Formação Acadêmica e Resumo Profissional) estão dentro de um mesmo `div` com `space-y-6`, mas a separação visual entre elas é inconsistente — o `div` do resumo usa `mt-8 pt-8 border-t` que conflita com o `space-y-6` do container pai, e não há títulos de seção claros para distinguir os dois blocos.

### Solução

**Em `src/pages/register/ProfessionalForm.tsx` (renderStep4):**
- Adicionar títulos de seção (`h3`) para "Formação Acadêmica" e "Resumo Profissional" com ícones, criando separação visual clara
- Aumentar o espaçamento do container para `space-y-8`
- Usar um separador (`border-t`) consistente entre as seções
- Remover o `mt-8` redundante do wrapper do resumo

**Em `src/components/register/EducationStep.tsx`:**
- Remover o texto descritivo redundante (já que o título da seção no pai vai cumprir esse papel), ou mantê-lo mas com espaçamento uniforme

**Em `src/components/register/ProfessionalSummaryField.tsx`:**
- Ajustar `space-y-3` para `space-y-4` para consistência com o EducationStep que usa `space-y-6`

### Resultado
As duas seções ficam visualmente separadas com títulos claros, espaçamento uniforme e uma linha divisória consistente entre elas.

