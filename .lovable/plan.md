

## Adicionar estado "Ao Vivo" na pagina do encontro

### Problema atual

Quando o evento esta acontecendo, a pagina mostra "Evento ja realizado" porque a logica atual considera `isPast = true` assim que o horario de inicio passa. Nao existe um estado intermediario para "ao vivo".

### Solucao

Criar um estado `isLive` que detecta quando o evento esta em andamento (entre inicio e fim) e melhorar a experiencia visual da pagina nesse momento.

### Alteracoes

**1. `src/pages/GroupSessionDetail.tsx`**

- Calcular `endDateTime` usando `duration_minutes`
- Adicionar logica `isLive`: verdadeiro quando `now >= sessionDateTime && now <= endDateTime`
- Ajustar `isPast`: so considerar passado quando `now > endDateTime`
- Quando `isLive`:
  - Exibir badge pulsante vermelha: "Acontecendo agora" com icone de circulo vermelho
  - Exibir um banner destacado no topo do conteudo com fundo vermelho/destructive suave e animacao pulse
  - Manter o `MeetingLinkButton` visivel e desbloqueado
  - Remover o `LiveCountdown` (que ja cuida do "acontecendo agora" mas de forma diferente)

**2. `src/components/group-sessions/SessionCountdown.tsx`**

- Adicionar verificacao: quando a sessao ja comecou mas nao terminou, retornar null (deixar a logica de "ao vivo" para a pagina de detalhe)

**3. `src/components/group-sessions/LiveCountdown.tsx`**

- Quando `diff <= 0` e dentro da duracao, mostrar "Acontecendo agora" com visual mais impactante (badge maior, animacao)

### Detalhes tecnicos

No `GroupSessionDetail.tsx`, linha 100-102:

```typescript
const sessionDateTime = parseISO(`${session.session_date}T${session.start_time}`);
const endDateTime = new Date(sessionDateTime.getTime() + (session.duration_minutes || 60) * 60000);
const now = new Date();
const isLive = now >= sessionDateTime && now <= endDateTime;
const isPast = session.status === 'completed' || now > endDateTime;
```

Nova badge "Ao Vivo" com visual destacado:
```tsx
{isLive && (
  <Badge className="gap-1 bg-red-600 text-white animate-pulse border-red-600">
    <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
    Acontecendo agora
  </Badge>
)}
```

Banner "Ao Vivo" acima do titulo:
```tsx
{isLive && (
  <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-red-600/10 border border-red-500/30">
    <div className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
    </div>
    <span className="font-bold text-red-600 text-lg">Este evento esta acontecendo agora!</span>
  </div>
)}
```

### Resumo de arquivos
- `src/pages/GroupSessionDetail.tsx` - Logica isLive, badge, banner visual
- `src/components/group-sessions/LiveCountdown.tsx` - Ajustar estado "acontecendo agora" para considerar duracao
- `src/components/group-sessions/SessionCountdown.tsx` - Retornar null durante sessao ao vivo

