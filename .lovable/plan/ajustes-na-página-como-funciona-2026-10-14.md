# Ajustes na página Como funciona

## Objetivo
Dois ajustes pontuais em `src/pages/HowItWorks.tsx`, sem alterar conteúdo, ordem das seções, links ou rotas.

## 1. Remover o texto "Dados para mais pessoas bem hoje e sempre"
- É o componente `<Eyebrow>` no topo da seção Hero (linha ~162), com quebra `<br />`.
- Remover apenas esse `<Eyebrow>`; título, parágrafo, botão e cartões informativos permanecem como estão. O espaçamento entre o cabeçalho da seção e o `<h1>` será mantido naturalmente pela margem existente do título.

## 2. Substituir a imagem do Buddy no cartão "Buddy sempre por perto"
- Hoje o cartão (seção "Como funciona", pilares) renderiza `<BuddyCharacter variant="arms" />` — o mascot inteiro de braços abertos.
- O usuário quer o rosto do Buddy, semelhante à imagem anexada: primeiro plano circular da cabeça — capuz roxo em anel, rosto branco, olhos escuros e sorriso.
- Como o rosto já existe no asset atual `src/assets/buddy-main.png`, recortar apenas a cabeça (crop determinístico via Python/PIL) e salvar como novo arquivo `src/assets/buddy/buddy-face.png` (fundo transparente preservado do PNG original).
- Adicionar o import do novo arquivo em `src/components/hero/BuddyCharacter.tsx` como nova variante `face` (mantendo todas as variantes existentes), e no cartão de `HowItWorks.tsx` trocar `variant="arms"` por `variant="face"`, mantendo tamanho e classes atuais (`h-24 w-24 self-center object-contain`).
- O asset novo não passa por CDN (é pequeno e fica no repositório, como os demais PNGs do Buddy); nenhum `.asset.json` é necessário.

## Validação
- Checar `/tmp/observability/build-errors.log` após o build.
- Playwright em desktop e mobile: confirmar ausência do texto removido no hero e o rosto do Buddy renderizado no cartão, sem overflow.
