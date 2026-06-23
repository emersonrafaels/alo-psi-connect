# Iniciar prática direto da sessão + pluralização

## Mudanças em `src/pages/praticas/PraticasIndex.tsx`

1. **Pular tela de configurações**: o botão "Começar prática" do destaque passa a apontar para a rota da sessão (`/sessao`) em vez da página de detalhes. `PraticaSessao` já funciona com defaults (duração default da prática, áudio default, padrão de respiração da prática), portanto não precisa de query params.
   - De: `to={\`${basePath}/praticas/${destaque.slug}\`}`
   - Para: `to={\`${basePath}/praticas/${destaque.slug}/sessao\`}`
   - O segundo botão "Ver orientações" mantém o link atual para a página de detalhes.

2. **Pluralização correta**: trocar `"Começar prática de X minutos"` para usar singular quando `duracao_min_default === 1`:
   - `Começar prática de {n} {n === 1 ? "minuto" : "minutos"}`

## Fora de escopo

- Outras telas que mostram "X minutos"
- Lógica de `PraticaSessao`
