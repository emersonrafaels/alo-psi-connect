## Objetivo

Adicionar uma opção configurável por tenant (no Dashboard Admin → Editar Tenant) para mostrar ou ocultar o preço dos profissionais em todo o site. Quando desativada, o preço fica oculto em todas as páginas públicas e apenas reaparece na etapa de pagamento (BookingConfirmation), evitando bugs no cálculo.

## 1. Banco de dados

Migration: adicionar coluna em `tenants`:
- `show_professional_prices boolean not null default true`

Manter default `true` para não alterar o comportamento atual de tenants existentes.

## 2. Tipos e contexto

`src/types/tenant.ts`: adicionar `show_professional_prices?: boolean` em `Tenant`.

O `TenantContext` já carrega `select('*')`, então o campo virá automaticamente. Vou criar um pequeno helper `useShowPrices()` (em `src/hooks/useTenant.tsx` ou novo `usePriceVisibility.tsx`) que retorna `tenant?.show_professional_prices !== false`.

## 3. Admin UI

`src/components/admin/TenantConfigTabs.tsx` — na aba `ModulesConfigTab` (ou criar item análogo logo abaixo dos módulos), adicionar um Checkbox:

- Label: "Exibir preços dos profissionais"
- Tooltip: "Quando desativado, o valor da consulta deixa de aparecer em listagens, perfis e cards. O preço só será mostrado na etapa final de pagamento."
- Liga em `formData.show_professional_prices` (default `true`).

Em `TenantEditorModal.tsx`: incluir `show_professional_prices` no estado inicial / load do tenant / payload do `update`.

## 4. Esconder preço nos componentes públicos

Usar o helper `useShowPrices()` e renderizar condicionalmente (não passar `consultationPrice`, esconder o bloco "R$ X por consulta", remover filtros de preço quando aplicável):

- `src/components/professional-card.tsx` — esconder bloco `consultationPrice` (ambas variantes compact e padrão).
- `src/components/home/HomeRedeBemEstar.tsx` (linhas 782-784) e `HomeMedcos.tsx` (linha 366) — não exibir `preco_consulta`.
- `src/components/ProfessionalProfile.tsx` (linhas 325 e 443) — esconder os dois blocos de preço no perfil.
- `src/pages/Professional.tsx` (linha 231) — esconder `formatPrice(...)` no cabeçalho. O `CalendarWidget` continua recebendo `price` (necessário para gerar a URL de checkout), mas devemos esconder a exibição visual (ver item 5).
- `src/pages/Schedule.tsx` (linha 206) — esconder.
- `src/pages/Appointment.tsx` (linhas 286-317) — esconder o bloco "Valor da consulta" do resumo (mantendo o cupom funcional, mas sem revelar o número). Exibição final do preço acontece somente em BookingConfirmation.
- `src/pages/Professionals.tsx`:
  - Esconder coluna/badge de preço nos cards (linhas 2281-2317).
  - Quando `show_professional_prices=false`, ocultar todos os filtros e ordenações por preço (slider de valor, ordenar por menor/maior preço — linhas 351/354/777/894/987/1316-1317/1847-1849/1983) e o badge "Até R$ X de economia" (linha 2041).
  - Sort por preço removido das opções do dropdown.

## 5. CalendarWidget

`src/components/CalendarWidget.tsx` (linhas 432-445): envolver o display "💰 R$ X" em `showPrices && (...)`. O cálculo continua intacto; só a UI some.

## 6. Onde o preço CONTINUA aparecendo

- `src/pages/BookingConfirmation.tsx` — etapa de pagamento: mostra preço, descontos, total. Sem alterações.
- Áreas administrativas (`pages/admin/*`, `ProfessionalInfoEditor`, `EditProfessionalModal`, gestão de cupons, financeiro): preço continua visível para admins/profissionais editarem.
- Formulário de cadastro do profissional (`PriceInput`): inalterado.

## 7. Detalhes técnicos

- O helper retorna `true` por padrão se tenant ou flag não estiverem definidos, garantindo retrocompatibilidade.
- Em rotas que usam `professionalId` mas o usuário ainda não passou pelo carrinho (`Appointment`, `Professional`, `Schedule`), o `price` continua sendo propagado via querystring/URL para `BookingConfirmation` — apenas a renderização é suprimida.
- Filtros por preço escondidos não devem ser aplicados ao filtrar (resetar `valorMin`/`valorMax` quando `showPrices=false`).
- Nenhuma mudança em edge functions.

## 8. QA pós-implementação

- Tenant com flag ativada (default): tudo igual.
- Tenant com flag desativada: nenhuma menção a "R$" nas páginas públicas (home, listagem, perfil, agenda, resumo de agendamento). Confirmar que BookingConfirmation ainda mostra o valor e completa o pagamento normalmente.
