

## Nova etapa: Formação Acadêmica no cadastro profissional

### Resumo
Adicionar uma nova etapa (Step 4) no formulário de cadastro profissional onde o profissional informa suas formações acadêmicas: instituição, curso e ano de conclusão. Permite cadastrar uma ou mais formações. As etapas seguintes serão renumeradas (de 8 para 9 total).

### 1. Nova tabela no banco de dados

Criar a tabela `professional_education` para armazenar formações de forma estruturada:

```sql
CREATE TABLE public.professional_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id INTEGER NOT NULL,
  institution_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  graduation_year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.professional_education ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can insert education" ON public.professional_education FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view education" ON public.professional_education FOR SELECT USING (true);
CREATE POLICY "Admins can manage education" ON public.professional_education FOR ALL USING (is_admin(auth.uid()));
```

### 2. Novo componente `EducationStep`

Criar `src/components/register/EducationStep.tsx`:
- Interface para adicionar formações (instituição, curso, ano de conclusão)
- Lista as formações já adicionadas com botão de remover
- Campo de instituição: input de texto livre
- Campo de curso: input de texto livre
- Campo de ano: select com anos (ex: 1980-2026)
- Botão "Adicionar formação"
- Validação: pelo menos 1 formação obrigatória

### 3. Alterações em `ProfessionalForm.tsx`

- Adicionar `formacoes` ao `formData` (array de `{ institution: string, course: string, year: number }`)
- `totalSteps` passa de 8 para 9
- Inserir nova etapa como Step 4 ("Formação acadêmica"), deslocando steps 4-8 para 5-9
- Adicionar `canProceedStep4 = formData.formacoes.length > 0`
- Atualizar títulos, validações e renderização dos steps
- No `handleSubmit`, salvar `formacoes` no campo `formacao_raw` da tabela `profissionais` (texto concatenado) para compatibilidade

### 4. Alterações na Edge Function `create-professional-profile`

- Receber `formacoes` no body da requisição
- Após criar o profissional, inserir os registros na tabela `professional_education`
- Atualizar `formacao_raw` com texto concatenado das formações

### 5. Atualizar `ProfilePreview.tsx`

- Exibir seção "Formação Acadêmica" na revisão final, listando instituições, cursos e anos

### Detalhes Técnicos

```text
Fluxo de etapas (antes → depois):
Step 1: Dados pessoais          → Step 1: Dados pessoais
Step 2: Info profissional       → Step 2: Info profissional
Step 3: Perfil e contatos       → Step 3: Perfil e contatos
Step 4: Resumo profissional     → Step 4: Formação acadêmica (NOVO)
Step 5: Especialidades          → Step 5: Resumo profissional
Step 6: Horários                → Step 6: Especialidades
Step 7: Credenciais             → Step 7: Horários
Step 8: Revisão                 → Step 8: Credenciais
                                → Step 9: Revisão
```

Arquivos impactados:
- `src/pages/register/ProfessionalForm.tsx` (renumerar steps, adicionar formacoes ao formData)
- `src/components/register/EducationStep.tsx` (novo componente)
- `src/components/register/ProfilePreview.tsx` (exibir formações)
- `supabase/functions/create-professional-profile/index.ts` (salvar formações)
- Nova migration SQL para criar tabela `professional_education`

