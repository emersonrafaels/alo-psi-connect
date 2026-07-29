## Objetivo

No card "Seus contatos de emergência" (Meu Buddy → Pontos de força), adicionar um botão que abre um modal com o mesmo formulário de contatos de emergência que já existe em Meu Perfil, permitindo cadastrar/editar sem sair da página.

## O que será feito

1. **Extrair o formulário para um componente reutilizável**
   - Novo componente `EmergencyContactsEditor` a partir da lógica já existente em `src/pages/Profile.tsx` (aba "Saúde & Emergência"): carregar contatos do estudante, adicionar/remover (até 3), campos nome, relação, telefone, e-mail, e salvar na tabela `patient_emergency_contacts`.
   - `src/pages/Profile.tsx` passa a usar esse componente, mantendo o comportamento atual.

2. **Modal no card do Buddy**
   - Em `src/pages/buddy/BuddyStrengths.tsx`, adicionar botão:
     - "Adicionar contatos" quando a lista está vazia (substituindo o texto atual por texto + botão);
     - "Gerenciar contatos" quando já existem contatos.
   - O botão abre um `Dialog` contendo o `EmergencyContactsEditor`.
   - Ao salvar, o modal fecha e a lista do card é atualizada (invalidação da query `["buddy","emergency"]`).
   - O card também mostra um link secundário para "Meu perfil" como alternativa.

3. **Detalhes técnicos**
   - Sem mudanças de banco de dados; reutiliza a mesma tabela e regras já usadas pelo perfil.
   - O card do Buddy hoje lê `nome, telefone, parentesco`; o editor grava os mesmos campos usados pelo perfil, então será garantido o alinhamento de nomes de coluna ao integrar.
