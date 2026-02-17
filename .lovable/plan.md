

## Melhorias na aba de Triagem

### 1. Trocar "reg." por "registros"

Na linha 209, alterar `{student.entryCount} reg.` para `{student.entryCount} registros`.

### 2. Adicionar legenda explicativa dos niveis de risco

Abaixo dos cards de resumo, adicionar um card informativo (com icone `Info`) que explica cada nivel:

- **Critico**: Humor medio muito baixo (<=1.5), ansiedade muito alta (>=4.5) ou queda acentuada no humor (>40%)
- **Alerta**: Humor baixo (<=2.5), ansiedade alta (>=3.5) ou energia muito baixa (<=1.5)
- **Atencao**: Humor moderadamente baixo (<=3.0), ansiedade moderada (>=3.0) ou qualidade de sono ruim (<=2.0)
- **Saudavel**: Indicadores dentro da faixa esperada
- **Sem Dados**: Aluno sem registros nos ultimos 14 dias

Sera um componente colapsavel (comeca fechado) com titulo "Como funciona a classificacao de risco?" para nao poluir a tela.

### 3. Melhorias adicionais de UX/UI e funcionalidade

**UX/UI:**

- **Tooltips nos indicadores**: Adicionar tooltips nos icones de cada indicador (Humor, Ansiedade, Energia, Sono) para que o usuario saiba o que cada numero significa ao passar o mouse
- **Labels nos indicadores**: Trocar icones sozinhos por icones + label curto (ex: "Humor: 2.6" em vez de apenas icone + 2.6)
- **Barra de progresso visual nos cards**: Adicionar uma mini barra de progresso nos cards de resumo mostrando a proporcao de cada risco em relacao ao total
- **Busca por nome**: Adicionar campo de busca para filtrar alunos por nome

**Funcionalidade:**

- **Exportar relatorio**: Botao para exportar a lista de alunos com seus indicadores e nivel de risco em formato CSV/Excel (ja tem a lib xlsx instalada)
- **Botao "Triar" tambem para alunos saudaveis**: Permitir triar qualquer aluno, nao apenas os de risco, pois o admin pode querer registrar observacoes preventivas

### Resumo de arquivos

| Arquivo | Acao |
|---|---|
| `src/components/institution/StudentTriageTab.tsx` | Trocar "reg." por "registros", adicionar legenda de risco, tooltips nos indicadores, busca por nome, botao exportar, permitir triar qualquer aluno |

