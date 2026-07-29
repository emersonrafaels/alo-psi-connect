## Objetivo
Tirar "Radar Institucional" da barra de navegação e colocá-lo no menu suspenso que abre ao clicar no nome do usuário.

## Mudanças (apenas `src/components/ui/header.tsx`)
1. Remover o item condicional `Radar Institucional` da lista de navegação (usada tanto no desktop quanto no menu mobile), mantendo o cálculo de `radarHref` e o hook `useRadarAccess`.
2. Adicionar no `DropdownMenuContent` do usuário, para quem tem `hasRadarAccess`, um `DropdownMenuItem` "Radar Institucional" com ícone de radar, navegando para o mesmo `radarHref` (admin → `/admin/radar-institucional`; demais → portal institucional).
   - Posicionar logo após "Portal Institucional" para agrupar itens institucionais.
3. No menu mobile (usuário logado), garantir que o mesmo item apareça na seção de conta, já que ele sai da lista de navegação.

## Observações
- Regras de acesso permanecem inalteradas (`useRadarAccess` / `has_radar_access`).
- A página pública `/radar-institucional` continua acessível por link direto.
