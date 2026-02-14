

## Visao de Indicadores para o Dono do Encontro

### Objetivo

Adicionar um painel de indicadores (KPIs) no topo da aba "Meus Encontros Criados" que mostre metricas consolidadas de todos os encontros do facilitador.

### Indicadores propostos

1. **Total de Encontros** - quantidade de sessoes criadas (todas)
2. **Encontros Aprovados** - sessoes com status `scheduled`
3. **Total de Inscritos** - soma de registrations confirmadas em todas as sessoes
4. **Taxa de Ocupacao Media** - media de (inscritos / max_participants) entre sessoes aprovadas
5. **Encontros Realizados** - sessoes com status `completed`
6. **Cancelamentos** - total de registrations com status `cancelled`

### Layout

Uma grade de cards de KPI (3 colunas em desktop, 2 em tablet, 1 em mobile) acima da lista de sessoes, com icones, valores numericos em destaque e labels descritivos.

### Detalhes tecnicos

**Arquivo novo: `src/components/group-sessions/CreatedSessionsStats.tsx`**

Componente que recebe a lista de sessoes (ja carregada pela query existente em `MyCreatedSessionsTab`) e calcula os indicadores no frontend:

```typescript
interface CreatedSessionsStatsProps {
  sessions: any[];
}
```

Calculos:
- `totalSessions = sessions.length`
- `approvedSessions = sessions.filter(s => s.status === 'scheduled').length`
- `completedSessions = sessions.filter(s => s.status === 'completed').length`
- `totalRegistrations = sessions.reduce(sum of confirmed registrations)`
- `totalCancellations = sessions.reduce(sum of cancelled registrations)`
- `avgOccupancy = media de (confirmed / max_participants) das sessoes scheduled/completed`

Cada KPI sera um mini-card com:
- Icone (Calendar, CheckCircle, Users, TrendingUp, Award, XCircle)
- Valor numerico grande
- Label descritivo pequeno

**Arquivo modificado: `src/components/group-sessions/MyCreatedSessionsTab.tsx`**

- Importar e renderizar `<CreatedSessionsStats sessions={sessionsList} />` logo antes da lista de cards de sessoes (linha 127)
- Nenhuma mudanca na query -- os dados ja estao disponiveis

### Estilo visual

Os cards seguem o padrao do design system existente (Card do shadcn/ui) com cores sutis:
- Fundo levemente colorido para cada metrica
- Responsivo com `grid grid-cols-2 md:grid-cols-3 gap-4`
- Animacao sutil de entrada (`animate-fade-in`)

