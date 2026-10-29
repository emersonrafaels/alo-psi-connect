# Radar de Permanência para o aluno + dados reais no portal

## O que o aluno verá
- Novo item **Radar de Permanência** no menu do usuário, logo abaixo de "Minhas Emoções" (desktop e celular), visível apenas para alunos.
- Página `/radar-permanencia` reproduzindo o formulário do HTML anexo: os 11 temas / 77 perguntas, navegação por tema, barra de progresso, perguntas de escolha única e múltipla (com opções exclusivas como "Nenhuma dessas"), rascunho salvo automaticamente.
- Primeira vez: responder. Depois: tela de resumo com data da última resposta e botão **Atualizar respostas** (abre o formulário pré-preenchido). Cada envio gera uma nova versão; o histórico mostra as datas das respostas anteriores.
- Aviso de privacidade: a instituição só vê resultados coletivos de grupos com 10 ou mais respostas, nunca as respostas individuais.

## Dados
- Nova tabela de respostas (aluno, instituição, unidade/curso, semestre, respostas por pergunta, data). O aluno lê e cria só as próprias; equipe institucional não lê linhas individuais.
- Uma função agregada no banco monta o resumo por instituição/unidade/semestre no mesmo formato que o painel já usa, considerando apenas a resposta mais recente de cada aluno por semestre e ocultando grupos com menos de 10.

## Dados fakes Afya
- Gerar respostas sintéticas para os alunos demonstrativos da Afya (semestres 2025.2, 2026.1 e 2026.2), coerentes com as unidades e com variação entre elas, incluindo algumas atualizações para formar histórico. Os casos de estudo protegidos (A–F) ficam de fora e nenhuma notificação é enviada.

## Portal institucional
- O Radar de Permanência passa a ler da função agregada (dados reais da plataforma). O snapshot demonstrativo atual deixa de ser usado; sem respostas suficientes aparece "Ainda sem dados".

## Detalhes técnicos
- Catálogo do instrumento em `src/features/permanence/instrument.ts` (perguntas do HTML), compartilhado pelo formulário e pelo mapeamento item → chave do `PermModel`.
- Tabela `permanence_responses` (jsonb `answers`, `semester`, `academic_unit_id`), GRANT + RLS por `auth.uid()`; RPC `get_institution_permanence(institution_id, semester)` SECURITY DEFINER com checagem de acesso institucional, retornando distribuições percentuais.
- `PermanenceView` troca a leitura de `institution_permanence_snapshots` pela RPC; `resolveModel` continua mesclando labels do código.
- Testes: regra "última resposta por aluno/semestre", ocultação n<10 e opções exclusivas no formulário.
- Atualizar a regra correspondente no `AGENTS.md`.
