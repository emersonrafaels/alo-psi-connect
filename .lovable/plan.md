# Passos clicáveis no "Seu check-in diário"

Na seção "Seu check-in diário, do seu jeito." da página inicial, os quatro passos viram botões. Ao clicar em um passo, ele fica destacado (roxo) e o texto do cartão muda. O Buddy, o botão "Começar agora" e o "Saiba mais" ficam iguais.

Textos sugeridos (posso trocar se você quiser outros):

1. **Registrar** — "Conte como você está se sentindo hoje." Registre suas emoções e os momentos que marcaram seu dia. Em poucos cliques, você cria o hábito de olhar para si com mais atenção e gentileza. Selos: Privado · Rápido · Acolhedor.
2. **Refletir** — "Entenda o que está por trás do que você sente." Escreva ou grave um áudio sobre o seu dia. O Buddy ajuda você a dar nome às emoções e a perceber o que mexeu com você. Selos: Escrita ou áudio · Sem julgamentos · No seu tempo.
3. **Perceber padrões** — "Veja como seus dias se conectam." Acompanhe a evolução do humor, do sono, da energia e da ansiedade em gráficos simples e descubra o que costuma influenciar seu bem-estar. Selos: Gráficos claros · Tendências · Descobertas.
4. **Cuidar de si** — "Transforme o que você percebeu em cuidado." Receba sugestões de práticas, encontros e apoios que combinam com o seu momento, e conte com profissionais quando precisar. Selos: Práticas guiadas · Apoios · Acompanhamento.

O selo "PASSO N · NOME" acima do título também acompanha o passo escolhido.

## Detalhes técnicos
- Arquivo: `src/components/emotionalcheckinhome/emotionalcheckinhome.tsx`.
- Estado `activeStep` (0–3) e um array com título, descrição e selos com ícones; os passos viram `<button>` com `aria-pressed` e a classe `--active` aplicada pelo estado.
- Troca de texto com uma transição suave de opacidade, respeitando `prefers-reduced-motion`; teclado funciona naturalmente pelos botões.
