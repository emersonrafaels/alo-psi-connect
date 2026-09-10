# Botões de apoio que levam a páginas inexistentes

## O que está acontecendo

Cinco apoios da biblioteca têm um botão de ação que aponta para um endereço que não existe no site, então o aluno cai em "página não encontrada". Os demais botões (Práticas, Encontros, Blog) funcionam.

Os cinco apoios afetados são os que levam ao atendimento com profissionais (ex.: Psicoterapia online, Consulta psiquiátrica online, Apoio psicopedagógico online).

## O que será feito

1. **Verificação automática do destino**: antes de mostrar o botão de ação (no modal de detalhes do apoio), a página confere se o endereço existe. Se não existir, o botão aparece desabilitado com o texto "Em breve", e o aluno continua podendo adicionar o apoio ao plano dele.
2. **Corrigir o destino dos 5 apoios de profissionais**: a página de profissionais existe, apenas o endereço cadastrado está errado (`/professionals` em vez de `/profissionais`). Corrigir o cadastro faz esses botões voltarem a funcionar em vez de ficarem desabilitados.
3. Se você preferir que esses cinco fiquem desabilitados mesmo assim, basta dizer e eu deixo só a verificação do item 1.

Com isso, qualquer apoio cadastrado no futuro com um endereço inexistente já nasce com o botão desabilitado, sem levar ninguém a uma página de erro.

## Detalhes técnicos

- Nova lista de rotas conhecidas (padrões declarados em `src/App.tsx`) exportada de um utilitário, ex. `src/features/apoios/knownRoutes.ts`.
- Em `src/pages/apoios/BibliotecaApoios.tsx`, o CTA do modal passa a validar `selected.ctaRoute` contra essa lista; quando não bate, renderiza um `Button disabled` ("Em breve") em vez do `Link`.
- Correção de dados: `update support_catalog set cta_route = '/profissionais' where cta_route = '/professionals'` (migration).
- Sem mudança de esquema, RLS ou hooks.
