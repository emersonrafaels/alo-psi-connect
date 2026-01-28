

## Plano: Corrigir Edge Function seed-demo-data

### Problema Identificado

A Edge Function `seed-demo-data` falhou ao criar dados para a UNICAMP porque:

1. **Profissionais**: A tabela `profissionais` exige `user_id` (integer) e `user_login` como NOT NULL, mas a função não estava definindo esses campos.

2. **Pacientes**: A tabela `pacientes` tem uma estrutura minimalista com apenas 6 colunas (`id`, `profile_id`, `eh_estudante`, `instituicao_ensino`, `created_at`, `tenant_id`). A função tentava inserir `nome`, `email`, `telefone` e `observacoes` que **não existem** nessa tabela.

---

### Correções Necessárias

#### 1. Função `seedProfessionals` (linhas 175-195)

**Antes:**
```typescript
await supabase.from("profissionais").insert({
  profile_id: profile.id,
  display_name: displayName,
  // ... faltando user_id e user_login
});
```

**Depois:**
```typescript
// Generate fake user_id (integer, starting from 99000)
const fakeUserId = 99000 + i;
const userLogin = email.split('@')[0];

await supabase.from("profissionais").insert({
  profile_id: profile.id,
  user_id: fakeUserId,
  user_login: userLogin,
  user_email: email,
  display_name: displayName,
  // ... resto igual
});
```

#### 2. Função `seedStudents` (linhas 262-273)

**Antes:**
```typescript
await supabase.from("pacientes").insert({
  profile_id: profile.id,
  nome: name.fullName,           // ❌ Coluna não existe
  email: email,                   // ❌ Coluna não existe
  telefone: "...",                // ❌ Coluna não existe
  instituicao_ensino: institutionName,
  observacoes: `${demoMarker}...` // ❌ Coluna não existe
});
```

**Depois:**
```typescript
await supabase.from("pacientes").insert({
  profile_id: profile.id,
  eh_estudante: true,
  instituicao_ensino: institutionName,
  tenant_id: tenantId,
});
```

#### 3. Ajustar `seedAppointments` (linhas 420-432)

Corrigir referências a `student.patient.nome`, `student.patient.email`, etc., que não existem mais:

```typescript
// Pegar dados do profile, não do patient
await supabase.from("agendamentos").insert({
  professional_id: professional.id,
  user_id: student.profile.id,  // UUID do profile
  tenant_id: tenantId,
  nome_paciente: student.profile.nome,   // Do profile
  email_paciente: student.profile.email, // Do profile
  telefone_paciente: "(00) 00000-0000",  // Placeholder
  // ... resto
});
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/seed-demo-data/index.ts` | Corrigir inserções em `profissionais` e `pacientes` |

---

### Validação Pós-Correção

Após deploy, chamar a função novamente para a UNICAMP:

```javascript
await supabase.functions.invoke('seed-demo-data', {
  body: {
    action: 'seed_all',
    institution_id: 'da361619-8360-449a-bdd9-45d42bba77a0',
    professionals_count: 5,
    students_count: 10,
    mood_entries_per_student: 12
  }
});
```

---

### Resultado Esperado

Após correção:
- 5 profissionais criados e vinculados à UNICAMP
- 10 estudantes criados e vinculados à UNICAMP  
- ~120 diários emocionais
- ~40 agendamentos
- 3-6 cupons promocionais

