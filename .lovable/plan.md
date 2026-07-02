## Objetivo

Substituir todas as ocorrências visuais do termo **"paciente"** por **"estudante"** nos principais pontos de contato do frontend, em toda a plataforma. O termo técnico interno (`tipo_usuario: 'paciente'`, variáveis, rotas, tabelas) permanece inalterado.

## Escopo: textos visíveis ao usuário

### 1. Header e navegação principal
- **Arquivo:** `src/components/ui/header.tsx`
- **Mudança:** Badge no dropdown do usuário: `"Paciente"` → `"Estudante"` (linha ~151)

### 2. Cadastro — seleção de tipo de usuário
- **Arquivo:** `src/pages/register/UserType.tsx`
- **Mudanças:**
  - Botão do card: `"Continuar como Paciente"` → `"Continuar como Estudante"` (linha ~94)
  - Descrição do card: ajustar "Sou um médico ou estudante de medicina" se necessário

### 3. Cadastro — formulário do paciente
- **Arquivo:** `src/pages/register/PatientForm.tsx`
- **Mudança:** Subtítulo do cabeçalho: `"Cadastro de Paciente"` → `"Cadastro de Estudante"` (linha ~924)

### 4. Área administrativa — gestão de usuários
- **Arquivo:** `src/pages/admin/Users.tsx`
- **Mudanças:**
  - Card de métricas: `"Pacientes"` → `"Estudantes"` (linha ~340)
  - Badge na listagem: `"Paciente"` → `"Estudante"` (linha ~415)
  - Texto de deleção: `"Perfil de paciente será deletado"` → `"Perfil de estudante será deletado"` (linha ~626)

### 5. Área administrativa — triagem (listagem completa)
- **Arquivo:** `src/components/triagem/PatientsTriageView.tsx`
- **Mudanças:**
  - Título padrão: `"Listagem Completa de Pacientes"` → `"Listagem Completa de Estudantes"`
  - Subtítulo: `"Visão consolidada de todos os pacientes da plataforma"` → `"Visão consolidada de todos os estudantes da plataforma"`
  - Nome do arquivo CSV: `"pacientes-"` → `"estudantes-"`
  - Coluna da tabela: `"Paciente"` → `"Estudante"`
  - Estado vazio: `"Nenhum paciente encontrado"` → `"Nenhum estudante encontrado"`

### 6. Perfil profissional e agenda
- **Arquivos:**
  - `src/components/ProfessionalProfile.tsx`: `"Compartilhe este link para que pacientes vejam seu perfil"` → `"Compartilhe este link para que estudantes vejam seu perfil"`
  - `src/components/GoogleCalendarWelcomeModal.tsx`: `"Pacientes veem apenas horários realmente disponíveis"` → `"Estudantes veem apenas horários realmente disponíveis"`
  - `src/components/GoogleCalendarIntegration.tsx`: `"Pacientes só veem horários realmente disponíveis"` e `"Melhora a experiência do paciente"` → `"Estudantes só veem horários realmente disponíveis"` e `"Melhora a experiência do estudante"`
  - `src/components/SpecialtiesSelector.tsx`: `"Isso ajudará os pacientes a encontrar o profissional ideal"` → `"Isso ajudará os estudantes a encontrar o profissional ideal"`

### 7. Cupons e vouchers
- **Arquivo:** `src/components/PatientCouponsCard.tsx`
- **Mudanças:**
  - `"Todos os Pacientes"` → `"Todos os Estudantes"`
  - `"Pacientes Externos"` → `"Estudantes Externos"`
  - `"Pacientes Selecionados"` → `"Estudantes Selecionados"`

- **Arquivo:** `src/components/admin/coupons/EditCouponModal.tsx`
- **Mudanças:**
  - Tooltip: `"Código que os pacientes usarão"` → `"Código que os estudantes usarão"`
  - Opções de visibilidade: `"Todos os pacientes"` / `"Apenas pacientes não-alunos"` → `"Todos os estudantes"` / `"Apenas estudantes não-alunos"`

### 8. Instituições e vínculos
- **Arquivo:** `src/components/InstitutionLinkRequestCard.tsx`
- **Mudanças:** Textos condicionais visíveis no card quando `userType === 'paciente'` (ex.: rótulos e status)

- **Hooks com toasts/mensagens visíveis:**
  - `src/hooks/useInstitutionPatients.tsx`: toasts `"Paciente vinculado"`, `"Erro ao vincular paciente"` → `"Estudante vinculado"`, `"Erro ao vincular estudante"`
  - `src/hooks/useInstitutionAudit.tsx`: rótulos de audit `"Paciente"`, `"Vinculação de Paciente"`, `"Desvinculação de Paciente"` → `"Estudante"`, `"Vinculação de Estudante"`, `"Desvinculação de Estudante"`

### 9. Fora do escopo (mantido como está)
- Variáveis, funções, tipos e interfaces no código (`tipo_usuario`, `isPatient`, `pacientes`, etc.)
- Nomes de rotas e paths de URL (`/cadastro/paciente`, `/admin/pacientes-completo`)
- Nomes de tabelas e colunas no Supabase (`pacientes`, `nome_paciente`)
- Mensagens de erro técnicas ou logs internos
- Comentários no código-fonte

## Validação
Após as alterações, executar `rg -i "paciente" -g '*.tsx' src/components src/pages` para confirmar que não restaram textos visuais de "paciente" nos componentes e páginas de frontend. O build (`bun run build`) deve passar sem erros.