# Plano: Corrigir tenant_id do WhatsApp para emersonssmile@gmail.com

## 🔍 Diagnóstico

A entrada de **26/04 caiu em `medcos`** (errado) porque o n8n usa `link.tenant_id` da tabela `whatsapp_profile_links`, que foi gravado **uma única vez** no momento da verificação OTP (25/04 às 01:58 UTC) e ficou "fossilizado":

| Tabela | tenant_id atual |
|---|---|
| `profiles` (corrigido na migração anterior) | **alopsi** ✅ |
| `whatsapp_profile_links` (não foi corrigido) | **medcos** ❌ |

Por isso, mesmo após a migração do `profiles`, toda nova mensagem do WhatsApp continua salvando entradas em `medcos`.

---

## 🛠️ Mudanças propostas

### 1. Migração SQL — corrigir o link e a entrada de 26/04

```sql
-- Sincronizar whatsapp_profile_links com o tenant atual do profile
UPDATE whatsapp_profile_links wpl
SET tenant_id = p.tenant_id,
    updated_at = now()
FROM profiles p
WHERE wpl.user_id = p.user_id
  AND wpl.user_id = '470164ee-cd69-46f3-b118-1ec3e48a0dab'
  AND wpl.tenant_id <> p.tenant_id;

-- Migrar a entrada de 26/04 (que entrou em medcos) para alopsi
UPDATE mood_entries
SET tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1'
WHERE user_id = '470164ee-cd69-46f3-b118-1ec3e48a0dab'
  AND tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5';
```

### 2. Ajuste no código n8n (você aplica no n8n)

Na função `saveMoodEntry`, **não confiar em `link.tenant_id`**. Buscar sempre o tenant atual do `profiles` antes de salvar. Substituir o início de `saveMoodEntry` por:

```javascript
async function getCurrentProfileTenant(userId) {
  const rows = await supabase(
    `profiles?user_id=eq.${encodeURIComponent(userId)}&select=tenant_id&limit=1`,
    { method: 'GET' }
  );
  return rows?.[0]?.tenant_id || null;
}

async function saveMoodEntry(link, payload, buddyMessage, riskLevel, rawPayload = {}) {
  const targetDate = payload.entry_date || todayISO();

  // 🔄 Sempre usar o tenant ATUAL do profile (fonte da verdade)
  const currentTenantId = await getCurrentProfileTenant(link.user_id) || link.tenant_id;

  // Se mudou, atualizar o link para refletir
  if (currentTenantId && currentTenantId !== link.tenant_id) {
    await supabase(
      `whatsapp_profile_links?phone=eq.${encodeURIComponent(link.phone)}`,
      { method: 'PATCH', body: JSON.stringify({ tenant_id: currentTenantId }) }
    );
  }

  // ... resto do código, mas usando currentTenantId em moodEntryPayload.tenant_id
}
```

### 3. (Opcional) Migração preventiva para outros usuários

Sincronizar TODOS os links que estejam fora do tenant atual do profile:

```sql
UPDATE whatsapp_profile_links wpl
SET tenant_id = p.tenant_id, updated_at = now()
FROM profiles p
WHERE wpl.user_id = p.user_id
  AND wpl.tenant_id <> p.tenant_id;
```

---

## ✅ Resultado esperado

- Entrada de 26/04 passa a aparecer no diário do tenant **alopsi**.
- Próximas mensagens do WhatsApp do Emerson vão para alopsi corretamente.
- Após o ajuste no n8n, qualquer migração futura de tenant no `profiles` será automaticamente refletida no WhatsApp.

## ⚠️ Observação

A parte SQL (itens 1 e 3) eu aplico aqui no Lovable. A parte do **n8n (item 2)** você precisa colar manualmente no nó de Code do seu workflow, pois o n8n é externo ao projeto.
