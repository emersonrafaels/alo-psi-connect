

## Busca Inteligente de Notas Institucionais

### Objetivo
Adicionar um campo de busca no componente `InstitutionNotesTab` que filtra notas por titulo, conteudo/descricao e datas, com debounce para performance.

### Implementacao

**Arquivo: `src/components/admin/InstitutionNotesTab.tsx`**

1. Adicionar estado `searchTerm` e usar o hook `useDebounce` existente (300ms)
2. Inserir campo de busca (Input com icone Search) entre o header e a lista de notas
3. Filtrar `notes` localmente (client-side) pelo termo debounced:
   - Titulo (`title`) - match case-insensitive
   - Conteudo (`content`) - match case-insensitive
   - Datas (`start_date`, `end_date`) - match no formato dd/MM/yyyy e tambem no formato original YYYY-MM-DD
4. Mostrar contador de resultados quando houver filtro ativo (ex: "3 de 8 notas")
5. Usar o utilitario `highlightText` existente em `src/utils/highlightHelpers.tsx` para destacar os termos encontrados no titulo e conteudo das notas
6. Mostrar estado vazio especifico quando a busca nao retorna resultados ("Nenhuma nota encontrada para 'termo'")

### Detalhes tecnicos

- Reutilizar `useDebounce` de `src/hooks/useDebounce.tsx`
- Reutilizar `highlightText` de `src/utils/highlightHelpers.tsx`
- Filtro 100% client-side (notas ja estao carregadas em memoria)
- Busca nas datas formata `start_date` e `end_date` para dd/MM/yyyy antes de comparar, permitindo buscar por "15/03" ou "2026"
- Nenhuma alteracao no banco de dados necessaria

