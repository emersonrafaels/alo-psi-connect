

## Alterar texto do botao bloqueado

### Correcao

**Arquivo:** `src/components/group-sessions/MeetingLinkButton.tsx`

Trocar o texto do botao desabilitado de "Entrar na Reuniao" para "Disponivel 15min antes", mantendo o icone de cadeado.

**Linha 52** - Alterar o texto dentro do botao:
```
// Antes
<Lock className="w-4 h-4" />
Entrar na Reunião

// Depois
<Lock className="w-4 h-4" />
Disponível 15min antes
```

### Escopo
- 1 arquivo, 1 linha alterada

