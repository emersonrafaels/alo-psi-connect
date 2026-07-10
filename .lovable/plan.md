## Objetivo
Ajustar dois pontos de UX no Portal Institucional:
1. Deixar a data/hora da "Última atualização" do diagnóstico do Buddy mais visível, posicionada no topo do painel, próxima ao botão "Atualizar".
2. Trocar o cumprimento do `WelcomeCard` no contexto institucional para "Boa tarde, Professor. Que bom te ver.".

## Alterações

### 1. `src/components/institution/BuddyInstitutionPanel.tsx`
- Remover o bloco de rodapé atual (linhas ~449-453) que exibe "Última atualização" em texto pequeno e discreto.
- Adicionar um elemento visível no topo do card hero de diagnóstico, ao lado do botão "Atualizar", contendo:
  - Ícone `Clock`.
  - Label "Última atualização".
  - Data/hora formatada em `pt-BR`.
  - Indicativo de que o diagnóstico permanece salvo até clicar em "Atualizar".
- Estilizar como badge/chip com fundo de destaque sutil (`bg-background/80`, borda `border-primary/20`, texto legível) para garantir contraste sem competir com o headline.
- Preservar a lógica de `generatedAt` e o estado de loading.

### 2. `src/components/institution/WelcomeCard.tsx`
- Adicionar prop opcional `greetingName?: string`.
- Se `greetingName` for fornecido, usá-lo no cumprimento.
- Se não for fornecido, manter a lógica atual (primeiro nome do perfil ou prefixo do email ou "Administrador").

### 3. `src/pages/InstitutionPortal.tsx`
- Ao renderizar `<WelcomeCard institutionName={...} />`, adicionar a prop `greetingName="Professor"`.

## Critérios de aceitação
- A data/hora da última atualização aparece no topo do painel do Buddy, alinhada ao botão "Atualizar", com destaque visual.
- O cumprimento no Portal Institucional exibe "Boa tarde, Professor. Que bom te ver." (adaptando bom dia/tarde/noite conforme horário).
- Nenhum outro uso do `WelcomeCard` é impactado.
