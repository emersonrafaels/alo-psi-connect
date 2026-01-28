

## Plano: Corrigir Bug de Data Inválida no Carregamento de Encontros

### Problema Identificado

A página de Encontros (`/medcos/encontros`) exibe erro "Erro ao carregar encontros" porque a query no hook `useGroupSessions` gera uma data inválida.

**Erro exato:** `date/time field value out of range: "2026-04-31"`

**Causa:** O código assume que todos os meses têm 31 dias:
```typescript
const endDate = `${year}-${month}-31`;  // Falha para abril (30 dias)
```

### Solução

Corrigir o cálculo da data final do mês para usar o último dia real do mês, usando a biblioteca `date-fns` que já está instalada no projeto.

---

### Alterações Técnicas

#### Arquivo: `src/hooks/useGroupSessions.tsx`

**Mudança:** Importar funções `endOfMonth` e `format` do `date-fns` e calcular corretamente a data final do mês.

**Antes:**
```typescript
if (filters?.month) {
  const [year, month] = filters.month.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;  // BUG
  query = query.gte('session_date', startDate).lte('session_date', endDate);
}
```

**Depois:**
```typescript
import { endOfMonth, format, parse } from 'date-fns';

// Dentro da queryFn:
if (filters?.month) {
  const monthDate = parse(filters.month, 'yyyy-MM', new Date());
  const startDate = format(monthDate, 'yyyy-MM-01');
  const lastDay = endOfMonth(monthDate);
  const endDate = format(lastDay, 'yyyy-MM-dd');
  query = query.gte('session_date', startDate).lte('session_date', endDate);
}
```

Esta correção:
- Usa `endOfMonth()` para obter o último dia correto do mês (28, 29, 30 ou 31)
- Funciona para todos os meses incluindo fevereiro em anos bissextos
- Mantém compatibilidade com o resto da aplicação

---

### Arquivo a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/hooks/useGroupSessions.tsx` | Adicionar import, corrigir cálculo de data |

### Estimativa

- 1 arquivo
- ~5 linhas de código

