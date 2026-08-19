# Roda das Emoções: palavras longas sem corte

Palavras de uma só sílaba visual como "Desaprovação", "Insignificante", "Sobrecarregado" ou "Ridicularizado" aparecem cortadas nos anéis 2 e 3.

## Causa

Em `EmotionWheel.tsx`:
- `wrap()` só divide rótulos com mais de uma palavra; termos longos de palavra única voltam inteiros.
- `fitFont()` aplica um piso de fonte (`min: 12`), então quando o espaço calculado é menor que esse piso o texto passa a extrapolar a largura do anel.
- O anel de nível 2 tem 90px de espessura e o texto fica na tangente (horizontal) em fatias largas, o que dá menos espaço útil que a orientação radial.

## Ajustes de layout

1. **Orientação radial para rótulos longos**: qualquer rótulo acima de ~10 caracteres passa a ser desenhado no sentido radial (do centro para fora), onde o espaço disponível é a espessura do anel e não a corda do arco.
2. **Quebra por sílaba aproximada em palavra única**: quando um rótulo de palavra única não couber, dividir em duas linhas em um ponto de vogal próximo ao meio (ex.: "Desapro-" / "vação"), com hífen visível na primeira linha.
3. **Piso de fonte real**: reduzir o mínimo para 10 e, quando ainda assim não couber, escolher a combinação (duas linhas + fonte reduzida) que efetivamente entra no espaço, em vez de estourar.
4. **Mais espaço nos anéis**: aumentar levemente a espessura do anel de nível 2 (de 140–230 para 138–236) e o raio dos rótulos, mantendo o anel externo e o núcleo intactos.
5. **Tamanho uniforme por anel**: manter a regra atual de usar o menor tamanho do anel, agora calculada já depois das quebras, para que todas as fatias fiquem visualmente consistentes.

## Escopo técnico

- Arquivo único: `src/features/jornada/components/EmotionWheel.tsx` (funções `wrap`, `fitFont`, raios dos setores e blocos de rótulos dos níveis 2 e 3).
- Nenhuma mudança em taxonomia, cores, dados ou lógica de seleção.
- Validação visual com Playwright: abrir `/praticas/jornada`, entrar nas famílias com os termos mais longos e conferir por captura de tela que nenhum rótulo é cortado.
