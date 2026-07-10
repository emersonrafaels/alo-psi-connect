## Objetivo
Substituir termos técnicos em inglês (`high`, `medium`, `low`, `critical`, etc.) por rótulos humanizados em português no portal institucional — começando pelo modal "Alertas críticos abertos" e propagando o padrão pelos demais componentes.

## Alterações

### 1. `src/hooks/useInstitutionExecutiveSummary.ts`
Traduzir `risk_level` e `priority` ao montar os alertas:
- `title`: `Triagem em aberto (risco high)` → `Triagem em aberto — risco alto`
- `subtitle`: `Prioridade: high` → `Prioridade: Alta`

Criar mapas locais:
```
RISK_PT = { high: 'alto', critical: 'crítico', medium: 'moderado', low: 'baixo', alto:'alto', critico:'crítico', crítico:'crítico', moderado:'moderado', baixo:'baixo' }
PRIORITY_PT = { high: 'Alta', medium: 'Média', low: 'Baixa', critical: 'Crítica' }
```

### 2. `src/components/institution/InstitutionExecutiveHeader.tsx`
- Badge do alerta crítico: hoje mostra `Alto` / `Médio` só para `high`/outros. Ajustar para cobrir `critical` → `Crítico`, `medium` → `Moderado`, `low` → `Baixo`, mantendo cores.
- Garantir que qualquer render de `a.severity` ou `risk_level` cru passe pelo mapa PT.

### 3. `src/components/institution/StudentTriageTab.tsx`
- Onde exporta CSV / exibe `t.priority` cru (linha 702, badges em cards linhas 1408/1409/1575/1576), usar `PRIORITY_PT` para exibição (manter valor cru para lógica/estilo).
- Confirmar que labels de risco (`critical/alert/attention/healthy/no_data`) já usam PT em UI; onde ainda aparecer valor cru, humanizar (`crítico`, `alerta`, `atenção`, `saudável`, `sem dados`).

### 4. Sanity check
Buscar no diretório `src/components/institution` e `src/pages/InstitutionPortal.tsx` por strings `high|medium|low|critical` renderizadas diretamente em JSX e trocar por rótulos PT. Não alterar valores usados como chaves de lógica, filtros, estilos ou payloads.

## Fora de escopo
- Backend/edge functions (já retornam PT via dicionários existentes).
- Renomear valores no banco.
- Ajustes de layout ou novas features.
