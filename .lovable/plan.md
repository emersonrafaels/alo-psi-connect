# Site lento e travado: causa e correção

## O que está acontecendo agora

O site não está lento por causa do código: o banco de dados do projeto está fora do ar neste momento.

Verificado agora (15:2x UTC): toda chamada de dados responde com erro 503 e a mensagem
`PGRST002 — Could not query the database for the schema cache`. O registro de erros do preview
mostra o mesmo: "Erro ao buscar tenant: PGRST002". Seis tentativas seguidas falharam.

Por isso Profissionais, Apoios e Diário Emocional ficam "carregando para sempre": as telas
esperam dados que nunca chegam, e a maioria delas não tem um limite de tempo nem uma mensagem
de erro — só o girinho de carregamento.

## Passo 1 — Restabelecer o banco (prioridade)

Nada no site volta ao normal antes disso.

- Reativar/despertar o projeto de banco (projetos pausados por inatividade voltam ao clicar em
  "Restore"/"Resume" no painel do Supabase).
- Confirmar a volta com uma consulta simples e recarregar o site.

Se o banco estiver ativo e ainda falhar, investigar esgotamento de conexões e consultas lentas
antes de mexer em qualquer tela.

## Passo 2 — Não deixar mais o site "travar" quando os dados falham

Mesmo com o banco de volta, hoje qualquer falha momentânea vira tela congelada. Ajustes:

- Tempo limite nas buscas de dados: em vez de girar indefinidamente, mostrar
  "Não conseguimos carregar agora" com botão "Tentar de novo".
- Estado de erro visível nas três telas citadas (Profissionais, Apoios, Diário Emocional) e no
  carregamento da instituição (que hoje bloqueia o site inteiro no início).
- Um aviso curto no topo quando o serviço de dados estiver indisponível, para o usuário entender
  que o problema não é a conexão dele.

## Passo 3 — Reduzir a lentidão percebida (depois que voltar)

Com o banco respondendo, medir de novo e atacar só o que aparecer de fato:

- Identificar as consultas mais lentas e as telas que fazem muitas chamadas em sequência.
- Ajustar o tempo de cache das listas que quase não mudam (catálogo de apoios, profissionais)
  para que a segunda visita seja instantânea.

## Detalhes técnicos

- Sintoma confirmado: `GET /rest/v1/tenants` → HTTP 503 com `PGRST002`; pooler indisponível
  (o próprio acesso administrativo ao banco reporta projeto pausado/acordando).
- `TenantContext` falha no primeiro carregamento, então todo o app parte de um estado incompleto.
- Resiliência: definir `retry`/`staleTime` coerentes e expor `isError` nos hooks React Query
  (`useProfessionals`, `useSupportCatalog`/`useStudentSupportLibrary`, `useMoodEntries`,
  `TenantContext`), com componente de erro reutilizável e botão de refetch.
- Passo 3 usa análise de consultas lentas do banco antes de qualquer otimização de código.

## Fora do escopo

Nenhuma mudança visual ou de regra de negócio; apenas disponibilidade, mensagens de erro e
desempenho.
