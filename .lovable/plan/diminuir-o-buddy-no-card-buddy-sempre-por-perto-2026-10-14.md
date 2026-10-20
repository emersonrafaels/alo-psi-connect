# Diminuir o Buddy no card "Buddy sempre por perto"

## O que muda

O rosto do Buddy no card "Buddy sempre por perto" (página Como funciona) será reduzido, mantendo o mesmo efeito de sair um pouco da borda superior do card.

- Tamanho atual: 96px de diâmetro.
- Novo tamanho: 72px no computador e 64px no celular.
- A sobreposição na borda superior será ajustada junto (fica menos deslocada para fora), para o rosto continuar "encostado" na borda sem parecer grande demais.
- Título, texto, selo "Apoio constante" e o restante da página permanecem exatamente como estão.

## Onde aparece

- Página "Como funciona" (`/como-funciona` e `/medcos/como-funciona`), seção "Escalas validadas, Diário Emocional e apoio contínuo", terceiro card.
- Nenhum outro uso do Buddy na página será alterado (o ícone pequeno de 44px na seção de acompanhamento continua igual).

## Detalhes técnicos

- Arquivo: `src/pages/HowItWorks.tsx`, linha ~213.
- Alteração na classe do `BuddyCharacter variant="face"`:
  - `h-24 w-24` (96px) -> `h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]` (64px mobile / 72px desktop)
  - `-mt-10` (40px de sobreposição) -> `-mt-7 sm:-mt-8` (28px mobile / 32px desktop)
- Sem alteração em `BuddyCharacter.tsx`, em assets ou em estilos globais.
- Verificação: typecheck (`bunx tsgo --noEmit -p tsconfig.app.json`), log de build e captura Playwright desktop/mobile do card para confirmar que o rosto fica menor, centralizado e sem cortar a borda.
