

## Adicionar Contato de Emergência ao cadastro de paciente

### O que muda

Inserir um novo step obrigatório **"Contato de Emergência"** entre o step 3 (Informações) e o step 4 (Foto). O paciente pode cadastrar de 1 a 3 contatos. Cada contato tem: nome, relação (combobox com opção "Outro"), e telefone e/ou email.

### Alterações

**1. `src/pages/register/PatientForm.tsx`**

- Adicionar ao `formData` um array `contatosEmergencia` com tipo:
```typescript
interface EmergencyContact {
  nome: string;
  relacao: string;
  relacaoOutro: string; // quando relação = "outro"
  telefone: string;
  email: string;
}
```
- Inicializar com 1 contato vazio.
- Incrementar `totalSteps` de 5 para 6 (sem login) / 4 para 5 (com login).
- Criar `renderStepEmergency()` — novo step 4 com:
  - Lista de contatos (1 a 3), cada um em um card com campos:
    - **Nome do contato** (Input, obrigatório)
    - **Relação** (Combobox com opções: Pai/Mãe, Cônjuge, Irmão/Irmã, Filho/Filha, Amigo/Amiga, Tutor/Responsável, Outro) — ao selecionar "Outro", exibe input de texto livre
    - **Telefone** (Input, pelo menos telefone ou email obrigatório)
    - **Email** (Input, pelo menos telefone ou email obrigatório)
  - Botão "Adicionar contato" (visível se < 3 contatos)
  - Botão de remover contato (visível se > 1 contato)
- Reajustar numeração dos steps seguintes (Foto vira 5, Senha vira 6).
- Atualizar `stepTitles` para incluir "Emergência".
- Adicionar validação `canProceedStepEmergency`: pelo menos 1 contato com nome, relação, e (telefone ou email) preenchidos.
- Ajustar condições de `disabled` nos botões de navegação.
- Passar `contatosEmergencia` no body do `supabase.functions.invoke('create-patient-profile')`.

**2. `supabase/functions/create-patient-profile/index.ts`**

- Receber `contatosEmergencia` do body.
- Após criar o paciente, inserir os contatos na tabela `patient_emergency_contacts`.

**3. Nova migration SQL** — criar tabela `patient_emergency_contacts`:
```sql
CREATE TABLE public.patient_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  relacao text NOT NULL,
  telefone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT contact_info_required CHECK (telefone IS NOT NULL OR email IS NOT NULL)
);

ALTER TABLE public.patient_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own emergency contacts"
  ON public.patient_emergency_contacts FOR SELECT
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own emergency contacts"
  ON public.patient_emergency_contacts FOR INSERT
  WITH CHECK (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own emergency contacts"
  ON public.patient_emergency_contacts FOR UPDATE
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own emergency contacts"
  ON public.patient_emergency_contacts FOR DELETE
  USING (patient_id IN (
    SELECT p.id FROM pacientes p
    JOIN profiles pr ON p.profile_id = pr.id
    WHERE pr.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all emergency contacts"
  ON public.patient_emergency_contacts FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role full access"
  ON public.patient_emergency_contacts FOR ALL
  USING (true) WITH CHECK (true);
```

### Resumo de arquivos
- `src/pages/register/PatientForm.tsx` — novo step de contato de emergência
- `supabase/functions/create-patient-profile/index.ts` — salvar contatos no banco
- Nova migration SQL — tabela `patient_emergency_contacts` com RLS

