

## Adicionar aviso LGPD no Diário Emocional

Reutilizar o mesmo padrão visual do `LGPDNotice` do portal institucional, mas com texto adaptado para o contexto do diário emocional do usuário.

### Alteração

**Arquivo:** `src/pages/MoodDiary.tsx`

- Importar `LGPDNotice` de `@/components/institution/LGPDNotice`
- Criar um componente inline `MoodDiaryLGPDNotice` (ou reutilizar o padrão do `Collapsible` + `Alert` do `LGPDNotice`) com texto adaptado:
  - Título: "Seus dados são protegidos"
  - Corpo: Explicar que os dados do diário são criptografados, anonimizados quando compartilhados com instituições, e tratados conforme a LGPD
  - Link para política de privacidade
- Inserir logo após o header/descrição (linha ~171), antes dos Quick Stats

Como o `LGPDNotice` existente tem texto específico para instituições ("dados agregados e anônimos"), criarei um componente similar mas com mensagem voltada ao usuário final.

### Escopo
- 1 arquivo editado: `src/pages/MoodDiary.tsx`
- Componente inline usando mesmo padrão visual (Collapsible + Alert + Shield icon)

