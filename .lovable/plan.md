# Anonimizar alunos no portal institucional

## Objetivo
Garantir que todas as instituições vejam identificadores como **Aluno #1**, **Aluno #2** e assim por diante, sem exibir nomes ou e-mails reais no portal, independentemente da configuração atual de cada instituição.

## Implementação
- Criar uma identificação anônima consistente por aluno dentro da instituição, usando o vínculo interno apenas para manter o mesmo número nas diferentes telas.
- Aplicar os identificadores anônimos na lista geral de alunos, avatares, busca, ordenação e janela de histórico.
- Remover e-mails e outros elementos de identificação direta da página de alunos e dos arquivos exportados.
- Aplicar a mesma regra em toda a área de triagem: alunos pendentes, triagens em andamento ou concluídas, detalhes, seleção em lote, resolução, reabertura e relatórios exportados.
- Aplicar a anonimização nas áreas institucionais que listam alunos, incluindo Buddy dos Alunos, sem alterar nomes de profissionais ou usuários administradores.
- Preservar os identificadores internos usados para abrir históricos, registrar triagens e salvar permissões; apenas a apresentação ao usuário institucional será anonimizada.

## Validação
- Conferir que nenhum nome ou e-mail real de aluno aparece nas páginas e janelas do portal institucional.
- Testar busca por “Aluno #N”, abertura de histórico, triagem individual e em lote, além das exportações.
- Validar a experiência em computador e celular e confirmar a compilação sem erros.

## Observação técnica
A configuração opcional existente deixará de controlar a exibição no portal institucional: a interface institucional adotará anonimização obrigatória e segura por padrão. Os dados originais continuarão preservados e acessíveis somente aos fluxos internos autorizados que necessitam dos identificadores técnicos.
