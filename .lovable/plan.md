

## Classificar Indicadores em 4 Faixas (Critico, Alerta, Atencao, Saudavel)

### O que muda

Atualmente, a barra de cada metrica (humor, ansiedade, energia, sono) usa apenas 3 cores baseadas em porcentagem generica (verde/amarelo/vermelho). O pedido e alinhar as cores com os mesmos limiares da classificacao de risco da triagem.

### Novas faixas por metrica

As cores da barra e do valor numerico passarao a refletir exatamente os criterios de risco:

| Metrica | Critico (vermelho) | Alerta (laranja) | Atencao (amarelo) | Saudavel (verde) |
|---|---|---|---|---|
| Humor | ≤ 1.5 | ≤ 2.5 | ≤ 3.0 | > 3.0 |
| Ansiedade | ≥ 4.5 | ≥ 3.5 | ≥ 3.0 | < 3.0 |
| Energia | - | ≤ 1.5 | - | > 1.5 |
| Sono | - | - | ≤ 2.0 | > 2.0 |

Para energia e sono, que nao tem todos os 4 niveis definidos nos criterios de risco, serao interpoladas faixas coerentes:

| Metrica | Critico | Alerta | Atencao | Saudavel |
|---|---|---|---|---|
| Energia | ≤ 1.0 | ≤ 1.5 | ≤ 2.5 | > 2.5 |
| Sono | ≤ 1.5 | ≤ 2.0 | ≤ 2.5 | > 2.5 |

### Detalhes tecnicos

**Arquivo:** `src/components/institution/StudentTriageTab.tsx`

1. **Criar funcao `getMetricBand`** que recebe `(value, metric)` e retorna `'critical' | 'alert' | 'attention' | 'healthy'` com base nos limiares acima.

2. **Atualizar `MetricBar`** para usar `getMetricBand` em vez do calculo generico de porcentagem para definir a cor:
   - Critico: `bg-red-500`
   - Alerta: `bg-orange-500`
   - Atencao: `bg-yellow-500`
   - Saudavel: `bg-green-500`

3. **Passar o tipo de metrica** como prop para `MetricBar` (ex: `metric="mood"`, `metric="anxiety"`), para que a funcao saiba quais limiares aplicar.

4. **Atualizar os 4 usos de MetricBar** nos cards dos alunos para incluir a nova prop `metric`.

5. **Opcional:** Exibir ao lado do valor numerico um dot ou badge com a cor da faixa, para reforcar visualmente o status mesmo sem olhar a barra.

