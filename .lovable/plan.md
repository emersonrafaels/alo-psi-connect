
## Adicionar Badge "Evento ja realizado" para sessoes passadas

### Objetivo

Exibir uma badge vermelha/cinza "Evento ja realizado" na pagina de detalhes do encontro quando a data/hora do evento ja passou. Tambem adicionar essa badge na secao de encontros passados e nos cards de listagem.

### Mudancas

**1. `src/pages/GroupSessionDetail.tsx`**

Na area de badges (linha 145-154), adicionar logica para verificar se o evento ja passou:

```
const isPast = session.status === 'completed' || sessionDateTime < new Date();
```

Se `isPast`, renderizar uma badge com variante `destructive` ou estilo customizado cinza:
```
{isPast && (
  <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground border-muted-foreground/30">
    <CheckCircle2 className="w-3 h-3" />
    Evento ja realizado
  </Badge>
)}
```

Tambem esconder o `LiveCountdown` e o `SessionCountdown` quando o evento ja passou (ja retornam null naturalmente para eventos passados, mas a badge adiciona clareza).

**2. `src/components/group-sessions/PastSessionsSection.tsx`**

Adicionar a mesma badge "Evento ja realizado" nos cards de encontros passados, dentro do bloco de informacoes (ao lado do tipo de sessao ou na area de metadados).

### Resumo

| Arquivo | Acao |
|---------|------|
| `src/pages/GroupSessionDetail.tsx` | Adicionar badge "Evento ja realizado" quando sessao passou |
| `src/components/group-sessions/PastSessionsSection.tsx` | Adicionar badge nos cards de encontros passados |
