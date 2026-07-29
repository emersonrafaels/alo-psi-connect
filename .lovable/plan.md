## Objetivo
Remover a etapa "Agora" do retrato do Buddy e direcionar o usuário ao Diário Emocional para registrar humor e escalas.

## Mudanças (src/pages/buddy/BuddyPortrait.tsx)
1. Remover `"agora"` da lista `SECTIONS` — o stepper passa a começar em "Essência".
2. Remover o componente `SectionAgora` e sua renderização condicional.
3. Remover as constantes `MOODS` e o helper `MoodChip` para humor (mantendo o uso em "Buddy" para o tom preferido).
4. Ajustar `computeProgress` para não contar mais: `current_mood`, `anxiety`, `sadness`, `motivation`, `energy_level`, `sleep_quality`, `stress_level`, `mind_on` — assim o percentual reflete só o que ainda é pedido.
5. Adicionar, no topo do retrato, um aviso curto: "Humor, sono e energia vêm do seu Diário Emocional" com link para `/diario-emocional` (rota confirmada antes da edição).

## Notas técnicas
- Nenhuma mudança de banco: as colunas continuam existindo em `buddy_portraits` e os valores já salvos permanecem intactos e disponíveis para a IA.
- O `ScaleRow` continua em uso na seção "Limites" (facilidade em pedir ajuda), então permanece.
