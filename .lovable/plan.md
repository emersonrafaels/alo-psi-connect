

## Configuracao de Anonimizacao de Alunos

### Objetivo

Criar uma configuracao no painel admin que permita habilitar/desabilitar a anonimizacao dos nomes de alunos no portal institucional. O sistema tera um **valor padrao global** (aplicado a todas as instituicoes) e a possibilidade de **sobrescrever por instituicao**.

### Arquitetura

```text
Prioridade de resolucao:
  1. Configuracao da instituicao (se definida) -> usa ela
  2. Configuracao global padrao -> fallback
  3. Nenhuma configurada -> default = true (anonimizado por seguranca)
```

### Mudancas no Banco de Dados

**1. Nova coluna na tabela `educational_institutions`:**

- `anonymize_students` (boolean, nullable, default null)
- Quando `null`, herda o valor global. Quando `true/false`, sobrescreve.

### Mudancas no Painel Admin

**2. Novo componente `AnonymizationConfig`** (`src/components/admin/config/AnonymizationConfig.tsx`):

- Usa `useSystemConfig(['institution'])` para ler/gravar a config global
- Chave: `institution.default_anonymize_students` (valor: `true`/`false`)
- Switch para o padrao global com explicacao
- Tabela listando todas as instituicoes com um select de 3 opcoes cada:
  - "Usar padrao global" (null)
  - "Anonimizar" (true)
  - "Mostrar nomes" (false)
- Busca instituicoes via Supabase e atualiza a coluna `anonymize_students` diretamente

**3. Registrar no `Configurations.tsx`:**

- Adicionar card "Anonimizacao de Alunos" na categoria "Cadastro e Usuarios" com icone `Shield`

### Mudancas no Portal Institucional

**4. Novo hook `useAnonymizationConfig`** (`src/hooks/useAnonymizationConfig.tsx`):

- Recebe `institutionId`
- Busca o valor de `anonymize_students` da instituicao
- Busca o default global via `usePublicConfig` ou query direta em `system_configurations`
- Retorna `{ isAnonymized: boolean, loading: boolean }`
- Logica: se instituicao tem valor definido, usa; senao, usa global; senao, default `true`

**5. Funcao de anonimizacao `anonymizeStudentName`:**

- Recebe nome completo, retorna versao anonimizada
- Formato: "Aluno 1", "Aluno 2", etc. (baseado em indice) ou "L***s S***a" (primeiras e ultimas letras mascaradas)
- Sugestao: usar formato "Aluno #XX" onde XX e um hash curto do patientId para manter consistencia

**6. Aplicar em `StudentTriageTab.tsx`:**

- Importar o hook `useAnonymizationConfig`
- Quando anonimizado:
  - Nomes exibidos como "Aluno #1", "Aluno #2", etc.
  - Iniciais do avatar como "A1", "A2"
  - Exportacao tambem anonimizada
  - Tooltip indicando "Nomes anonimizados por politica da instituicao"
- Quando nao anonimizado: comportamento atual (nomes reais)

**7. Aplicar em `StudentActivityModal.tsx`:**

- Nome do aluno no titulo do modal tambem anonimizado

### Arquivos Afetados

| Arquivo | Acao |
|---|---|
| Migracao SQL | Adicionar coluna `anonymize_students` (boolean nullable) em `educational_institutions` |
| `src/components/admin/config/AnonymizationConfig.tsx` | Novo - painel de config global + por instituicao |
| `src/pages/admin/Configurations.tsx` | Adicionar card de Anonimizacao |
| `src/hooks/useAnonymizationConfig.tsx` | Novo - hook para resolver config efetiva |
| `src/components/institution/StudentTriageTab.tsx` | Aplicar anonimizacao nos nomes e exportacao |
| `src/components/institution/StudentActivityModal.tsx` | Anonimizar nome no modal |
| `src/components/institution/BatchTriageDialog.tsx` | Anonimizar nomes na listagem de lote |

### Detalhes de Seguranca

- O default sera `true` (anonimizado) para garantir privacidade mesmo se nenhuma configuracao for feita
- A configuracao global usa `system_configurations` (ja existente, com RLS para admins)
- A coluna na instituicao e protegida pelo RLS existente da tabela `educational_institutions` (apenas admins podem gerenciar)

