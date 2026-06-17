## Problema

Ao reenviar a escala ISI (já respondida há ~7min), a edge function retorna 409 `frequency_blocked` (limite de 180 dias). O frontend deveria mostrar a mensagem amigável "Você só pode responder esta escala a cada 180 dias", mas exibe "Edge Function returned a non-2xx status code".

**Causa raiz:** em `src/hooks/useEmotionalScales.tsx` (`useSubmitScaleResponse`), o código tenta ler `error.context.body` como string/objeto, mas `error.context` do `supabase.functions.invoke` é um `Response` cujo corpo precisa ser lido via `await response.json()`. O parse falha silenciosamente e re-lança o erro genérico.

## Correção

**Arquivo:** `src/hooks/useEmotionalScales.tsx` — bloco `if (error) { ... }` do `mutationFn`.

Substituir a lógica por:

```ts
if (error) {
  const ctx: any = (error as any).context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const parsed = await ctx.json();
      throw Object.assign(
        new Error(parsed.message || parsed.error || error.message),
        { details: parsed }
      );
    } catch (e: any) {
      if (e?.details) throw e;
    }
  }
  throw error;
}
```

Isso faz com que `frequency_blocked` (e qualquer outro erro JSON da edge function) seja propagado com `details`, permitindo que `ScaleResponse.tsx` exiba o toast amigável já implementado (linhas 76-80).

## Escopo

Apenas frontend. Sem alteração na edge function, no banco ou nas faixas de severidade.