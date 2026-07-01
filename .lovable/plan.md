## Objetivo
Fazer os botões dos cards de recomendação da página `/buddy` (Home) navegarem para as áreas certas da plataforma, mantendo o feedback ("marcar como feito" / dispensar) já registrado.

## Situação atual
Em `src/pages/buddy/BuddyHome.tsx`, cada card gerado pelo Buddy tem dois botões:
- **CTA principal** (ex.: "Fazer Check-in", "Abrir Chat", "Iniciar Prática", "Ver Ferramentas") — hoje só chama `feedback.mutate({ action: "done" })` e não leva o usuário a lugar nenhum.
- **X (dispensar)** — já funciona (marca como `dismissed`).

As recomendações vêm do edge function `buddy-generate-insights` com `category ∈ { pratica | encontro | conteudo | rotina | apoio }` e um texto opcional `cta`. Não há `action_url` no payload.

## Mudanças (somente frontend, em `BuddyHome.tsx`)

1. Criar um mapa `categoryToAction` que traduz `category` em destino:
   - `rotina` → navega para `/diario-emocional/nova-entrada`
   - `pratica` → navega para `/praticas`
   - `encontro` → navega para `/encontros`
   - `conteudo` → navega para `/escalas` (ferramentas de autoanálise já existentes)
   - `apoio` → abre o `AIAssistantModal` (chat com o Buddy) via estado local
   - fallback → navega para `/buddy/como-te-conhece`

2. Ajustar o botão principal do card:
   - Ao clicar: (a) dispara `feedback.mutate({ recommendationId, action: "done" })` como hoje, (b) executa a ação da categoria (navegar com `useNavigate` ou abrir o modal).
   - Continua exibindo o texto de `rec.cta` quando vier do backend, senão um rótulo padrão por categoria ("Fazer check-in", "Iniciar prática", "Ver encontros", "Ver ferramentas", "Abrir chat").

3. Adicionar estado `chatOpen` + render condicional de `<AIAssistantModal open={chatOpen} onOpenChange={setChatOpen} ... />` no final da página, para atender à categoria `apoio`.

4. Manter o botão de X (dispensar) inalterado.

## Fora de escopo
- Não alterar o edge function nem o schema das recomendações.
- Não mudar layout/design dos cards, só o comportamento dos botões.
- Não mexer nos demais botões da página ("Atualizar percepções", "Ver o que o Buddy percebeu", "Atualizar meu retrato") — já são funcionais.
