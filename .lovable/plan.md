

## Mover encontro para o tenant Rede Bem Estar

### O que sera feito

Atualizar o `tenant_id` do encontro "Roda de conversa sobre pressao do periodo de provas" de **Medcos** (`3a9ae5ec-50a9-4674-b808-7735e5f0afb5`) para **Rede Bem Estar** (`472db0ac-1437-4c46-8e40-cbecc43db22d`).

### Detalhes tecnicos

Executar um UPDATE no banco de dados:

```text
UPDATE group_sessions
SET tenant_id = '472db0ac-1437-4c46-8e40-cbecc43db22d'
WHERE title LIKE '%pressão do período de provas%'
  AND tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5';
```

Apos a atualizacao, o encontro aparecera na pagina `/encontros` do tenant Rede Bem Estar em fevereiro.

