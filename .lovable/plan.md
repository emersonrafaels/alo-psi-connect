

## Esconder botao "Entrar na Reuniao" para eventos passados

### Problema

O `MeetingLinkButton` aparece mesmo para eventos ja realizados. Ele so deveria aparecer para eventos futuros (e ficar clicavel 1h antes).

### Mudanca

**`src/pages/GroupSessionDetail.tsx`**

Envolver a renderizacao do `MeetingLinkButton` com a condicao `!isPast`:

```tsx
{!isPast && session.meeting_link && (
  <MeetingLinkButton ... />
)}
```

Isso remove o botao completamente para eventos passados, mantendo-o apenas para eventos futuros (onde a logica de 1h antes continua funcionando normalmente).

### Arquivo

| Arquivo | Acao |
|---------|------|
| `src/pages/GroupSessionDetail.tsx` | Adicionar condicao `!isPast` ao redor do MeetingLinkButton |

