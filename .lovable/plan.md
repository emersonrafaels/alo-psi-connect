
Objetivo: corrigir o comportamento do toggle de módulos no Admin (tenant), para que ao desabilitar e salvar, o valor permaneça desabilitado após reabrir/atualizar.

Diagnóstico encontrado no código atual:

1) O estado do formulário permite editar `modules_enabled` no tab “Módulos”:
- Arquivo: `src/components/admin/TenantConfigTabs.tsx`
- `ModulesConfigTab` escreve em `formData.modules_enabled`.

2) Porém esse campo não está sendo carregado nem persistido no modal:
- Arquivo: `src/components/admin/TenantEditorModal.tsx`
- `formData` inicial não declara `modules_enabled`.
- No `useEffect` que preenche o formulário ao editar tenant, `modules_enabled` não é copiado de `tenant`.
- No `tenantData` enviado no `handleSubmit`, `modules_enabled` não é incluído no payload.
- Resultado: o usuário marca/desmarca localmente, mas o banco nunca recebe essa mudança; ao reabrir, volta para o valor antigo (que hoje está `true` para os módulos existentes).

3) Evidência no banco:
- `tenants.modules_enabled` está salvo apenas com os módulos antigos e habilitados (`blog`, `mood_diary`, `ai_assistant`, `professionals`, `appointments`) para os tenants principais.
- Isso confirma que os novos toggles não estão sendo persistidos.

Plano de implementação:

Fase 1 — Persistência correta de `modules_enabled` no TenantEditorModal
1. Atualizar o tipo local `Tenant` em `src/components/admin/TenantEditorModal.tsx` para incluir:
   - `modules_enabled?: { ... }` com todas as chaves atuais (`blog`, `mood_diary`, `ai_assistant`, `professionals`, `appointments`, `group_sessions`, `contact`, `about`).
2. Incluir `modules_enabled` no estado inicial de `formData` (modo novo tenant):
   - Definir defaults explícitos como `true` para evitar comportamento ambíguo.
3. Incluir `modules_enabled` no preenchimento de `formData` no `useEffect` quando estiver editando tenant:
   - Carregar do banco se existir.
   - Aplicar fallback com default `true` por módulo quando não existir (compatibilidade com tenants antigos).
4. Incluir `modules_enabled` no objeto `tenantData` do `handleSubmit`:
   - Persistir exatamente o mapa atualizado de módulos.
   - Garantir que booleans sejam enviados como boolean (sem string/null).

Fase 2 — Sincronização de UI após salvar (evitar percepção de “voltou”)
5. Após sucesso do update:
   - Manter o `onSuccess()` (já chama `refetch` em `/admin/tenants`).
   - Garantir que o refetch seja aguardado/consumido antes de próxima edição para evitar abrir modal com estado antigo em cache local da tela.
6. (Opcional recomendado) Ao fechar e reabrir o modal rapidamente:
   - Reidratar sempre a partir do objeto recém-refetchado, não de estado antigo em memória.

Fase 3 — Robustez para tenants legados
7. Padronizar normalização dos módulos:
   - Se `modules_enabled` vier parcial, completar com defaults.
   - Isso evita que módulos novos apareçam com comportamento inconsistente em tenants antigos.

Validações de aceite (teste manual end-to-end):
1. Abrir `/admin/tenants`, editar tenant “medcos”, aba “Módulos”.
2. Desabilitar “Blog” e “Contato”, clicar “Atualizar”.
3. Fechar e reabrir o mesmo tenant:
   - Os checkboxes devem permanecer desmarcados.
4. Recarregar a página (`F5`) e reabrir:
   - Deve continuar desabilitado.
5. Verificar no banco (SELECT em `tenants.modules_enabled`):
   - Deve refletir `blog: false`, `contact: false` (e demais chaves preservadas).
6. Validar comportamento no frontend do tenant:
   - Links do header dessas páginas ocultos.
   - Acesso direto por URL redirecionado pelo `ModuleGuard`.

Riscos e mitigação:
- Risco: sobrescrever config antiga ao salvar.
  - Mitigação: sempre mesclar com defaults + estado atual do formulário.
- Risco: tenants sem chave nova.
  - Mitigação: fallback explícito por módulo.
- Risco: percepção de rollback por latência/refetch.
  - Mitigação: sincronização pós-mutation e reidratação consistente.

Arquivos a ajustar:
- `src/components/admin/TenantEditorModal.tsx` (principal correção)
- (Sem mudança estrutural de banco; não requer migration)

Resultado esperado:
- O toggle de módulos passa a ser realmente persistido por tenant.
- Desabilitar não “volta para habilitado”.
- Consistência entre Admin, banco e navegação pública.
