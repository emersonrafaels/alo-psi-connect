

## Alterar tempo de liberacao do botao "Entrar na Reuniao"

### Problema
Atualmente o botao "Entrar na Reuniao" e liberado 60 minutos antes do inicio da sessao. O usuario deseja que seja liberado apenas 15 minutos antes.

### Correcao

**Arquivo:** `src/components/group-sessions/MeetingLinkButton.tsx`

Duas alteracoes na mesma logica:

1. **Linha 17** - Estado inicial: trocar `<= 60` por `<= 15`
2. **Linha 20** - Checagem no intervalo: trocar `<= 60` por `<= 15`
3. **Linha 53** - Tooltip: atualizar texto de "Disponivel 1h antes" para "Disponivel 15min antes do evento"

### Escopo
- 1 arquivo editado
- 3 linhas alteradas
- Sem necessidade de deploy de edge function

