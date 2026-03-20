

## Adicionar informações completas ao perfil do paciente

### Situação atual
O perfil do paciente exibe apenas: Nome, Email, Data de nascimento, Gênero, CPF e Como conheceu. Mas há mais dados disponíveis no banco que foram coletados no cadastro.

### Dados disponíveis para adicionar

| Campo | Tabela | Tipo |
|-------|--------|------|
| Raça/Etnia | `profiles.raca` | Editável |
| Sexualidade | `profiles.sexualidade` | Editável |
| Estudante/Formado | `pacientes.eh_estudante` | Somente leitura |
| Instituição de ensino | `pacientes.instituicao_ensino` | Somente leitura |
| Contatos de emergência | `patient_emergency_contacts` | Visualização + edição |

### Alterações

**1. `src/pages/Profile.tsx`** — Tab "Informações Pessoais" do paciente (linhas 380-514)

- Adicionar campos `raca` e `sexualidade` ao `formData` state e ao `useEffect` de população
- Adicionar os campos no formulário após Gênero:
  - **Raça/Etnia** (Select: Branca, Preta, Parda, Amarela, Indígena, Prefiro não informar)
  - **Sexualidade** (Select: Heterossexual, Homossexual, Bissexual, Pansexual, Assexual, Prefiro não informar)
- Adicionar uma nova tab "Emergência" (transformar grid de 2 tabs para 3) ou uma seção extra dentro de "Informações Pessoais"

**2. `src/pages/Profile.tsx`** — Nova seção de Contatos de Emergência

- Buscar dados de `pacientes` (eh_estudante, instituicao_ensino) e `patient_emergency_contacts` via queries ao carregar
- Exibir seção "Informações Acadêmicas" com status estudante e instituição (somente leitura, vem do cadastro)
- Exibir seção "Contatos de Emergência" com os contatos cadastrados, permitindo visualizar e editar (adicionar/remover até 3)

**3. Estrutura de tabs atualizada para paciente**

Mudar de 2 tabs para 3:
- Informações Pessoais (nome, email, nascimento, gênero, raça, sexualidade, cpf, como conheceu)
- Saúde & Emergência (status acadêmico + contatos de emergência editáveis)
- Instituição (mantém como está)

### Resumo de arquivos
- `src/pages/Profile.tsx` — adicionar campos, nova tab, buscar dados adicionais

