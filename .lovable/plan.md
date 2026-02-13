

## Reordenar abas e melhorar "Meus Encontros Criados"

### Mudancas de ordem e UX

As abas para facilitadores serao reordenadas para:

```text
+---------------------+-------------------------+------------------+
| Encontros Inscritos | Meus Encontros Criados  | + Criar Encontro |
+---------------------+-------------------------+------------------+
```

A aba "Criar Encontro" tera um estilo diferenciado com icone `+` para parecer um botao de acao.

### Melhorias na aba "Meus Encontros Criados"

Cada card de sessao criada passara a exibir:

1. **Indicadores visuais** - Barra de progresso mostrando vagas preenchidas vs total (`current_registrations / max_participants`)
2. **Lista de inscritos** - Secao expansivel (Collapsible) mostrando nome e data/hora da inscricao de cada participante
3. **Contagem de inscritos** - Badge destacado com numero atual de inscritos

A query sera expandida para buscar os registros da tabela `group_session_registrations` junto com os dados do perfil (`profiles`) de cada inscrito.

### Detalhes tecnicos

**`src/pages/MyGroupSessions.tsx`**
- Reordenar as `TabsTrigger`: `my-sessions` -> `my-created-sessions` -> `create-session`
- Reordenar as `TabsContent` na mesma ordem
- Estilizar a aba "Criar Encontro" com visual de botao (cor primaria, borda diferenciada)

**`src/components/group-sessions/MyCreatedSessionsTab.tsx`**
- Expandir a query para incluir `group_session_registrations(*, profiles:user_id(display_name, avatar_url))` via join
- Adicionar componente `Progress` mostrando `current_registrations / max_participants`
- Adicionar secao `Collapsible` com lista de inscritos: nome, data de inscricao (`registered_at`) formatada
- Melhorar os cards com layout mais rico: separadores visuais, icones coloridos por status
- Usar `AlertDialog` em vez de `confirm()` nativo para exclusao (melhor UX)
- Adicionar estado vazio mais informativo com link para criar encontro

