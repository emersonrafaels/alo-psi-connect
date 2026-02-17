
## Contagem Regressiva e Link Clicavel na Pagina de Detalhe

### Objetivo

Quando faltar poucas horas para o evento, exibir uma contagem regressiva em tempo real (hh:mm:ss) na pagina de detalhes. Alem disso, o link da reuniao (meeting_link) so se torna clicavel 1 hora antes do inicio do evento.

### Mudancas

**1. Novo componente: `src/components/group-sessions/LiveCountdown.tsx`**

Componente que recebe `sessionDate` e `startTime` e exibe:
- Uma contagem regressiva em tempo real (atualizada a cada segundo via `setInterval`) quando faltam menos de 24h
- Formato: "Comeca em 02:34:15" com icone de relogio
- Estilizado com cores de urgencia (vermelho pulsante quando < 1h, amarelo quando < 6h, etc.)
- Quando o horario chega, exibe "Acontecendo agora!" com animacao
- Retorna `null` se faltar mais de 24h (o `SessionCountdown` existente ja cobre esses casos com badges como "Em 3 dias")

**2. Novo componente: `src/components/group-sessions/MeetingLinkButton.tsx`**

Componente que recebe `meetingLink`, `sessionDate`, `startTime` e `isRegistered`:
- Calcula se falta menos de 1 hora para o evento
- Se sim e usuario esta inscrito: renderiza botao clicavel "Entrar na Reuniao" com icone de Video e link aberto em nova aba
- Se nao: renderiza botao desabilitado com tooltip/texto explicativo "Disponivel 1h antes do evento"
- Atualiza a cada minuto para verificar se ja pode liberar

**3. Modificar: `src/pages/GroupSessionDetail.tsx`**

- Importar `LiveCountdown` e `MeetingLinkButton`
- Adicionar `LiveCountdown` abaixo do `SessionCountdown` no topo, ou dentro do card de data/horario
- Substituir a exibicao estatica "Online (Google Meet)" pelo `MeetingLinkButton` que controla se o link e clicavel ou nao
- Manter o `SessionCountdown` (badge) para informacoes de dias, e o `LiveCountdown` para contagem em tempo real nas ultimas horas

**4. Modificar: `src/components/group-sessions/SessionCountdown.tsx`**

- Quando `hoursUntil <= 24`, nao renderizar badge (para evitar duplicidade com o `LiveCountdown`)
- Manter comportamento atual para "Amanha", "Em X dias"

### Detalhes tecnicos

Logica do LiveCountdown:
```text
const [timeLeft, setTimeLeft] = useState({ hours, minutes, seconds })

useEffect(() => {
  const interval = setInterval(() => {
    const diff = sessionDateTime - Date.now()
    if (diff <= 0) { setIsLive(true); return }
    setTimeLeft({
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    })
  }, 1000)
  return () => clearInterval(interval)
}, [])
```

Logica do MeetingLinkButton:
```text
const isUnlocked = differenceInMinutes(sessionDateTime, now) <= 60
// Atualiza a cada 30s para detectar quando libera
```

### Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/group-sessions/LiveCountdown.tsx` | Criar - contagem regressiva em tempo real |
| `src/components/group-sessions/MeetingLinkButton.tsx` | Criar - botao de link condicional |
| `src/pages/GroupSessionDetail.tsx` | Modificar - integrar ambos componentes |
| `src/components/group-sessions/SessionCountdown.tsx` | Modificar - evitar duplicidade quando < 24h |
