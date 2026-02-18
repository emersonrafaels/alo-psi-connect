
## Corrigir Modal que Nao Mostra Conteudo

### Problema
A mudanca anterior adicionou `h-0 min-h-0` ao `ScrollArea`, o que colapsou sua altura para zero. O conteudo (Diario Emocional / Historico de Triagens) nao aparece porque o `ScrollArea` tem altura zero e o `flex-1` nao consegue expandi-lo corretamente nesse contexto.

### Correcao

**Arquivo: `src/components/institution/StudentActivityModal.tsx`**

Substituir o `ScrollArea` (que tem problemas com altura flexivel) por um `div` com `overflow-y-auto` e altura maxima calculada:

- **Linha 256**: Trocar:
  ```
  <ScrollArea className="flex-1 mt-3 h-0 min-h-0" style={{ maxHeight: 'calc(85vh - 180px)' }}>
  ```
  Por:
  ```
  <div className="mt-3 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
  ```

- **Linha 269**: Trocar o fechamento correspondente:
  ```
  </ScrollArea>
  ```
  Por:
  ```
  </div>
  ```

Isso remove a dependencia do `ScrollArea` do Radix (que requer altura fixa explicita) e usa scroll nativo do navegador, que funciona com `max-height` sem problemas.
