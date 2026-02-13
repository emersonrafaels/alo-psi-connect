

## Reorganizar abas da pagina Meus Encontros

### Resumo

Atualmente, para facilitadores, existem 2 abas: "Meus Encontros" e "Criar Encontro". A mudanca sera:

1. **Renomear** "Meus Encontros" para **"Encontros Inscritos"** (mesma funcionalidade - mostra inscricoes do usuario)
2. **Manter** a aba **"Criar Encontro"** como esta
3. **Criar** uma nova aba **"Meus Encontros Criados"** que lista os encontros criados pelo usuario (atualmente essa listagem fica dentro da aba "Criar Encontro")

Para usuarios comuns (sem permissao de facilitador), o titulo da pagina tambem muda de "Meus Encontros" para "Encontros Inscritos".

### Estrutura das abas (facilitadores)

```text
+---------------------+------------------+-------------------------+
| Encontros Inscritos | Criar Encontro   | Meus Encontros Criados  |
+---------------------+------------------+-------------------------+
```

### Detalhes tecnicos

**Arquivo: `src/pages/MyGroupSessions.tsx`**
- Alterar o titulo e a label da aba de "Meus Encontros" para "Encontros Inscritos"
- Expandir o grid de abas de 2 colunas para 3 colunas (`grid-cols-3`)
- Adicionar nova aba "Meus Encontros Criados" com valor `my-created-sessions`
- Importar e renderizar um novo componente `MyCreatedSessionsTab` nessa aba

**Novo componente: `src/components/group-sessions/MyCreatedSessionsTab.tsx`**
- Extrair a listagem de sessoes criadas do `CreateSessionTab` para este novo componente
- Mostra cards com status, data, horario, vagas e observacoes do admin
- Permite excluir sessoes pendentes
- Reutiliza a mesma query `facilitator-sessions` ja existente

**Arquivo: `src/components/group-sessions/CreateSessionTab.tsx`**
- Remover a listagem de sessoes (que migra para a nova aba)
- Manter apenas o botao e o formulario de criacao de novo encontro

**Arquivo: `src/components/ui/header.tsx`**
- Atualizar o label do menu de "Meus Encontros" para "Encontros Inscritos" (para usuarios comuns)
- Manter "Encontros" para facilitadores (ja esta assim)

