

## Melhorias de UX/UI na Pagina de Triagem

### Problemas identificados na screenshot
- Titulo "Alunos para Triar" com `text-base` (16px) e muito pequeno e sem destaque visual
- Nomes dos alunos com `text-sm` (14px) se perdem entre badges e metricas
- Titulos das sub-abas "Triagens em Andamento", "Triagens Concluidas", "Historico Completo" tambem muito pequenos
- Cards de alunos sem separacao visual clara entre identidade e metricas
- Secao de metricas nao tem header visual, fica confusa
- Cards "Em Andamento" e "Concluidos" tem padding muito apertado (p-3)
- Badges de prioridade e status com `text-[10px]` sao dificeis de ler

### Mudancas planejadas

**1. Titulos de secao maiores e com mais destaque**
- `CardTitle` de cada aba: de `text-base` para `text-lg font-semibold`
- Adicionar descricao sutil abaixo do titulo (CardDescription) em cada aba

**2. Nomes dos alunos mais proeminentes**
- Nome do aluno: de `text-sm` para `text-base font-semibold`
- Adicionar um avatar placeholder (circulo com iniciais) antes do nome para destaque visual

**3. Cards de alunos com melhor estrutura**
- Adicionar separador visual (borda lateral colorida por risco) nos cards de "Para Triar" tambem
- Aumentar padding dos cards de p-4 para p-5
- Adicionar fundo sutil nos cards criticos (bg-red-50/30)

**4. Badges mais legiveis**
- Badges de prioridade/status: de `text-[10px]` para `text-xs`
- Badge de registros: de `text-[10px]` para `text-xs`

**5. Cards "Em Andamento" e "Concluidos" com mais respiracao**
- Padding de p-3 para p-4 nos concluidos
- Nomes dos alunos com mesmo destaque (text-base font-semibold)

**6. Secao de metricas com label de grupo**
- Adicionar um label sutil "Indicadores (14 dias)" acima das barras de metrica

**7. Tabs com visual mais robusto**
- Aumentar altura das tabs
- Badges de contagem ligeiramente maiores

### Detalhes tecnicos

| Arquivo | Mudanca |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Aumentar fontes de titulos e nomes, adicionar avatar com iniciais, borda lateral por risco nos cards pendentes, melhorar padding, badges maiores, label de metricas |

Apenas mudancas visuais/CSS. Sem alteracao de logica ou dados.
