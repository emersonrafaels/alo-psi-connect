

## Ajustar painel ilustrativo na seção de Dados

### Alterações em `src/pages/About.tsx` (linhas 413-438)

1. **Título**: Trocar "Painel ilustrativo" → "Indicadores de impacto"
2. **Remover gráficos de barras** e substituir por layout de **big numbers**:
   - **87%** Adesão
   - **4.8/5** Avaliação
   - **320/mês** Acompanhamentos
3. Layout: 3 colunas lado a lado, cada uma com número grande (`text-4xl font-bold`) + label abaixo (`text-sm text-muted-foreground`)
4. Cores nos números: roxo, rosa e verde-água respectivamente (paleta RBE)
5. Remover o container de barras (`h-48`) e simplificar para um grid clean com padding generoso

