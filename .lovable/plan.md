## Objetivos

1. ISEU-RBE atual só aparece calculado quando TODAS as escalas com peso foram respondidas (dentro da janela de 180d). Caso contrário, mostrar estado "Aguardando" com lista de escalas pendentes — sem exibir o número 30.52 parcial.
2. Inserir imagens explicativas (do S3) para cada escala e para o ISEU-RBE, posicionadas como um designer faria: acessíveis durante o preenchimento e na visualização do resultado, sem poluir.

## 1. ISEU-RBE só quando completo

**`src/pages/MyEmotions.tsx`** — substituir a regra de "latestIseu = último do histórico":
- Considerar `latestIseu` apenas se `missingScales.length === 0`.
- Card "ISEU-RBE atual":
  - Se completo: mostrar score + badge da faixa (como hoje).
  - Se incompleto: mostrar "—" grande em mute, badge `Aguardando` neutro, e copy: "Responda as N escalas pendentes para calcular: WHO5, PHQ9…" com botão "Responder agora" linkando para `/escalas`.
- Card "Evolução do ISEU-RBE": manter o histórico (não apagar pontos antigos válidos), mas exibir um aviso sutil "Cálculo pausado — escalas pendentes" quando incompleto.

**`src/pages/ScaleResponse.tsx`** — no bloco de resultado, manter a mesma regra: só mostra `result.iseu` quando o backend retorna; quando vier `missing_scales`, o estado "incompleto" já existe — apenas reforçar texto.

(Sem mudanças no backend: a edge function `submit-scale-response` já só preenche `result.iseu` quando completo. A correção é puramente frontend, escondendo a exibição do "último ISEU histórico" quando há pendências atuais.)

## 2. Imagens explicativas das escalas

Centralizar URLs num mapa local:

**Novo arquivo `src/data/scaleExplainers.ts`**
```ts
export const SCALE_EXPLAINERS: Record<string, string> = {
  WHO5:  "https://alopsi-website.s3.us-east-1.amazonaws.com/.../Who-5.jpeg",
  PHQ9:  "...PHQ-9.jpeg",
  GAD7:  "...GAD-7.jpeg",
  PSS10: "...PSS-10.jpeg",
  ISI:   "...ISI.jpeg",
  MHCSF: "...MHC-SF.jpeg",
};
export const ISEU_EXPLAINER = "...ISEU-RBE_v2.jpeg";
```

(URLs externas via S3 — sem subir para Lovable Assets, conforme fornecidas pelo usuário.)

### Onde aparecem

**A) `src/pages/EmotionalScales.tsx` (lista de escalas)**
- Em cada `renderScaleCard`, adicionar um botão discreto `<Info /> Entenda esta escala` no header do card.
- Ao clicar, abre um `Dialog` (shadcn) com:
  - Título: nome da escala
  - Imagem explicativa (responsiva, `max-h-[70vh]`, `object-contain`, fundo neutro, cantos arredondados)
  - Botão "Responder agora" no rodapé do dialog.
- Acima da grid, junto ao bloco "Faltam N escalas para calcular seu ISEU-RBE", adicionar botão `Como funciona o ISEU-RBE?` que abre o mesmo Dialog com a imagem `ISEU_EXPLAINER`.

**B) `src/pages/ScaleResponse.tsx` (preenchimento)**
- No card de cabeçalho (junto a `scale.name` e `instructions`), adicionar botão `<Info /> Como esta escala funciona`.
- Abre o mesmo componente `ScaleExplainerDialog` — usuário tira dúvida sem perder progresso (estado `answers` preservado).
- Também surge no card de resultado, próximo ao "Resultado:", para contextualizar a faixa obtida.

**C) `src/pages/MyEmotions.tsx`**
- No card "ISEU-RBE atual", ícone `<Info />` ao lado do título → abre dialog com `ISEU_EXPLAINER`.
- Em cada mini-card por escala (sparkline), ícone `<Info />` discreto no canto superior direito.

### Componente compartilhado

**Novo `src/components/scales/ScaleExplainerDialog.tsx`**
- Props: `open`, `onOpenChange`, `imageUrl`, `title`, `ctaLabel?`, `onCta?`.
- Usa `Dialog` do shadcn, conteúdo: imagem com loading skeleton, alt descritivo, e CTA opcional ("Responder agora" / "Voltar").
- Estilo limpo: `max-w-3xl`, padding generoso, sem bordas chamativas, foco na imagem.

## Detalhes técnicos

- Sem migrações de banco. Sem mudança em edge functions.
- Reuso de `useMissingIseuScales()` para o gating do ISEU.
- Lazy-load das imagens (`loading="lazy"`), `decoding="async"`.
- Mantém i18n PT-BR existente.

## Arquivos afetados

- novo `src/data/scaleExplainers.ts`
- novo `src/components/scales/ScaleExplainerDialog.tsx`
- edit `src/pages/MyEmotions.tsx` (gating ISEU + dialogs)
- edit `src/pages/EmotionalScales.tsx` (botão por card + botão ISEU)
- edit `src/pages/ScaleResponse.tsx` (botão no header e no resultado)
