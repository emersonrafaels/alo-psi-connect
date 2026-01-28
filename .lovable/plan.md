

## Plano: Sincronizar Configuração de Profissionais em Destaque

### Problema Identificado
Existe uma inconsistência de arquitetura onde dois sistemas diferentes controlam os profissionais em destaque:
- **Painel Admin** atualiza `profissionais.em_destaque` e `profissionais.ordem_destaque`
- **Homepage** lê de `professional_tenants.is_featured` e `professional_tenants.featured_order`

Resultado: As alterações feitas no admin não refletem na homepage.

### Solução Proposta
Modificar o componente `FeaturedProfessionalsConfig.tsx` para atualizar **ambas as tabelas** simultaneamente, garantindo que as alterações do admin reflitam corretamente na homepage por tenant.

---

### Alterações Técnicas

#### 1. Atualizar `FeaturedProfessionalsConfig.tsx`

**Arquivo:** `src/components/admin/config/FeaturedProfessionalsConfig.tsx`

**Mudanças:**
- Adicionar contexto de tenant para saber qual tenant está sendo gerenciado
- Na função `updateProfessionalFeatured`:
  - Manter a atualização em `profissionais` (para compatibilidade)
  - **Adicionar** atualização em `professional_tenants` com `is_featured` e `featured_order`
- Na função `updateProfessionalOrder`:
  - Atualizar também `professional_tenants.featured_order`
- Atualizar a query inicial para buscar dados de `professional_tenants` junto com `profissionais`

**Código exemplo da lógica:**
```typescript
// Atualizar profissionais (manter compatibilidade)
await supabase
  .from('profissionais')
  .update({ em_destaque: featured, ordem_destaque: finalOrder })
  .eq('id', professionalId);

// Atualizar professional_tenants (para a homepage)
await supabase
  .from('professional_tenants')
  .update({ is_featured: featured, featured_order: finalOrder })
  .eq('professional_id', professionalId)
  .eq('tenant_id', currentTenantId);
```

#### 2. Correção de Dados Atuais (Opcional)

Após a correção, sincronizar os dados existentes:
- Remover `is_featured = true` dos profissionais que não deveriam estar em destaque
- Configurar corretamente os 3 profissionais desejados via admin

---

### Benefícios
- Configurações do admin refletirão imediatamente na homepage
- Cada tenant pode ter seus próprios profissionais em destaque
- Mantém compatibilidade com o sistema legado (`em_destaque` na tabela profissionais)

### Estimativa
- 1 arquivo a modificar
- ~40 linhas de código alteradas

