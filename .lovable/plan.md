

## Adicionar Tooltips Explicativos nas Metricas Principais

### Objetivo
Adicionar tooltips informativos nos cards de "Visao Geral" e "Metricas de Bem-Estar" do dashboard, para que gestores leigos entendam o significado de cada indicador ao passar o mouse.

### O que muda para o usuario
Cada metrica tera um pequeno icone de interrogacao (?) ao lado do titulo. Ao passar o mouse, aparece uma explicacao simples e acessivel.

### Tooltips planejados

**Secao Visao Geral (4 cards):**
- **Participantes**: "Quantidade de alunos que registraram pelo menos um diario emocional no periodo selecionado."
- **Registros**: "Total de diarios emocionais preenchidos por todos os alunos no periodo. Quanto mais registros, mais confiavel a analise."
- **Tendencia**: "Compara a media de humor da primeira metade do periodo com a segunda metade. 'Em melhora' significa que o humor medio subiu, 'Em queda' que diminuiu."
- **Alertas**: "Numero de alunos com humor medio abaixo de 3 (em uma escala de 1 a 5). Esses alunos podem precisar de acolhimento."

**Secao Metricas de Bem-Estar (4 cards):**
- **Humor Medio**: "Media geral de como os alunos avaliaram seu humor (1=muito mal, 5=muito bem). Acima de 3.5 e considerado saudavel."
- **Ansiedade**: "Nivel medio de ansiedade reportado (1=tranquilo, 5=muito ansioso). Valores acima de 3.5 merecem atencao."
- **Qualidade do Sono**: "Como os alunos avaliaram seu sono (1=pessimo, 5=otimo). Sono ruim costuma afetar humor e concentracao."
- **Energia**: "Nivel medio de energia dos alunos (1=sem energia, 5=muita energia). Valores baixos podem indicar cansaco ou desmotivacao."

### Detalhes tecnicos

| Arquivo | Acao |
|---|---|
| `src/components/institution/InstitutionWellbeingDashboard.tsx` | Importar Tooltip/TooltipProvider/TooltipTrigger/TooltipContent, adicionar icone HelpCircle com tooltip em cada card |

- Usar o componente `Tooltip` ja existente em `@/components/ui/tooltip`
- Importar `HelpCircle` do lucide-react (ja importado na triagem, precisa importar no dashboard)
- Envolver todo o retorno com `TooltipProvider` (delayDuration curto, ex: 200ms)
- Em cada card, adicionar ao lado do titulo um `<Tooltip><TooltipTrigger><HelpCircle size 14 /></TooltipTrigger><TooltipContent>texto explicativo</TooltipContent></Tooltip>`

Mudanca em um unico arquivo, sem impacto em logica ou dados.

