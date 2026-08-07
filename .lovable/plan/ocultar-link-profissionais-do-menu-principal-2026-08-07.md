# Ocultar link "Profissionais" do menu principal

## Contexto
O link "Profissionais" no menu principal já é controlado pelo campo `modules_enabled.professionals` de cada tenant. Quando esse módulo está desabilitado, o link some do header (desktop e mobile), do footer e as rotas `/profissionais` e `/profissional/:id` passam a redirecionar para a home via `ModuleGuard`.

## Objetivo
Desabilitar o módulo "Profissionais" em todos os tenants para ocultar o link do menu principal.

## Opções de execução

### Opção A: Via painel administrativo (recomendada para poucos tenants)
1. Acessar `/admin` com usuário admin/super_admin.
2. Navegar até **Configurações > Tenants**.
3. Abrir a edição de cada tenant.
4. Na aba de módulos, desmarcar **Profissionais**.
5. Salvar e repetir para cada tenant.

### Opção B: Via SQL (recomendada para atualizar todos os tenants de uma vez)
Executar update na tabela `tenants` para definir `modules_enabled.professionals = false` em todos os registros, preservando as demais chaves do JSON:

```sql
UPDATE tenants
SET modules_enabled = COALESCE(modules_enabled, '{}') || '{"professionals": false}'::jsonb
WHERE modules_enabled->>'professionals' IS DISTINCT FROM 'false';
```

## Validação
- Abrir o preview de cada tenant e confirmar que o link "Profissionais" não aparece mais no header.
- Tentar acessar `/profissionais` e confirmar o redirecionamento para a home.
- Verificar que o link no footer também desapareceu.

## Nota
Nenhuma alteração de código é necessária. A funcionalidade já existe no `TenantConfigTabs` e no `ModuleGuard`.
