# Instituição demo EBMSP com dados completos

## Objetivo

Criar a instituição **EBMSP - Escola Bahiana de Medicina e Saúde Pública** no ambiente Rede Bem-Estar, com 100 novos alunos fictícios e dados suficientes para demonstrar os painéis de 15 e 30 dias, o Buddy, a triagem e os principais recursos da plataforma.

## O que será criado

### 1. Instituição e acesso

- Instituição privada, ativa e parceira, com gestão de usuários, profissionais e cupons habilitada.
- Associação ao ambiente **Rede Bem-Estar**.
- Novo administrador institucional usando `wixivir268@bowlfuel.com` e o nome de exibição **Administrador EBMSP**.
- Acesso do administrador apenas à EBMSP, sem copiar administradores de outras instituições.
- Senha temporária segura e fluxo existente de comunicação para primeiro acesso.

### 2. População fictícia própria

- **100 novos alunos**, sem reutilizar alunos da Carta Consulta ou AeroTD.
- Perfis claramente identificados como dados demonstrativos, com nomes e e-mails exclusivos da EBMSP.
- Cerca de **8 profissionais fictícios** vinculados à instituição, com diferentes especialidades e relações de trabalho.
- Liberação dos 100 alunos no painel **Buddy dos Alunos**.

### 3. Histórico emocional recente e comparável

- Registros concentrados nos **últimos 15 e 30 dias**, terminando na data da execução.
- Histórico adicional no período anterior para que comparações, tendências e variações do painel funcionem.
- Perfis emocionais variados e coerentes: estabilidade, ansiedade acadêmica, esgotamento, oscilação e melhora progressiva.
- Distribuição realista de humor, ansiedade, energia, sono, emoções, textos e marcadores, evitando números uniformes ou artificiais.
- Participação variada entre alunos para demonstrar engajamento, alertas e ausência ocasional de registros.

### 4. Recursos demonstráveis

Popular, de forma coerente entre si:

- diários emocionais e análises do Buddy;
- retratos, insights, forças, pontos de atenção e recomendações do Buddy;
- triagens em diferentes riscos e etapas, incluindo casos resolvidos e em acompanhamento;
- respostas das escalas emocionais ativas;
- práticas concluídas e jornadas de autorregulação;
- consultas realizadas, futuras, confirmadas e pendentes;
- inscrições e participação em encontros compatíveis com o ambiente Rede Bem-Estar;
- cupons institucionais demonstrativos.

### 5. Segurança e repetição segura

- O processo será específico e idempotente para a EBMSP: uma nova execução não duplicará instituição, vínculos ou registros.
- Os alunos fictícios terão contas técnicas próprias somente quando uma área exigir identidade de usuário; não receberão comunicações.
- Todos os registros demonstrativos receberão identificação consistente para permitir auditoria e limpeza futura sem afetar dados reais.
- Nenhuma estrutura do banco será alterada; serão usados as tabelas, permissões e funções já existentes.

## Implementação técnica

- Ampliar o gerador `seed-demo-data` para suportar uma carga institucional completa, datas relativas ao dia da execução e criação controlada de identidades demo.
- Corrigir o vínculo dos diários para preencher `user_id` e `profile_id`, preservando a restrição de um diário por aluno por dia.
- Adicionar geradores para Buddy, análises, escalas, práticas, jornadas, encontros e liberações institucionais.
- Tornar a limpeza do gerador completa para todos os registros dependentes e identidades exclusivamente demo.
- Executar a carga da EBMSP em lotes, evitando limites de requisição e validando cada conjunto antes de avançar.

## Validação final

- Confirmar os totais por categoria e que os 100 alunos são novos.
- Conferir cobertura e médias nos intervalos de 15 e 30 dias, além do período anterior de comparação.
- Validar que a EBMSP aparece no seletor institucional e que o novo administrador possui somente o acesso esperado.
- Abrir a visão institucional e verificar panorama, gráficos, risco, triagem e Buddy com dados visíveis e sem erros.
- Confirmar que Carta Consulta, AeroTD e demais instituições não foram alteradas.
