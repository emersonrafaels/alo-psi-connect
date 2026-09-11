# Ocultar "Meu Buddy" do menu superior (com controle no admin)

## Objetivo
Remover "Meu Buddy" da navegação superior por padrão e criar um controle no painel administrativo para deixá-lo visível ou oculto, por tenant (Alo Psi, Medcos etc.).

## Como vai funcionar
- Por padrão, "Meu Buddy" não aparece mais no menu superior (nem no menu mobile).
- No admin, na tela de configuração do tenant (aba "Módulos Habilitados"), passa a existir a opção "Meu Buddy (menu superior)".
- Ao marcar a opção, o item volta a aparecer no menu para usuários logados desse tenant. Ao desmarcar, ele desaparece.
- As páginas do Buddy continuam acessíveis por link direto; a mudança afeta apenas a visibilidade no menu. (Se você preferir bloquear também o acesso à página, me avise.)

## Detalhes técnicos
- `src/types/tenant.ts`: adicionar a chave `buddy?: boolean` em `modules_enabled`.
- `src/components/admin/TenantConfigTabs.tsx`: adicionar `{ key: 'buddy', label: 'Meu Buddy (menu superior)' }` à lista `modules`, com tooltip explicando o comportamento. Como o padrão do componente é "marcado quando indefinido", usar checagem explícita `=== true` para essa chave, para que o padrão seja oculto.
- `src/components/ui/header.tsx`: trocar a entrada fixa de "Meu Buddy" por uma condicional que exige usuário logado **e** `tenant?.modules_enabled?.buddy === true`. O restante do filtro de módulos continua igual.
- `src/hooks/useModuleEnabled.tsx`: incluir `'buddy'` no tipo `ModuleName` (mantendo a semântica opt-in tratada no header).

Nenhuma alteração de banco de dados é necessária — `modules_enabled` já é um campo JSON existente na tabela de tenants.
