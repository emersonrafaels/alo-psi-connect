# Rodapé com telefone antigo: causa e correção

## O que está acontecendo

O número já está correto no banco de dados: os dois sites (Rede Bem Estar e Medcos) têm o contato **(11) 97587-2447** salvo. O rodapé lê esse valor dinamicamente, então o código também está certo.

O problema é uma cópia local guardada no navegador: as informações do site (nome, cores, contatos) ficam salvas por 1 hora na máquina de quem visita. Quem abriu o site antes da mudança continua vendo o número antigo até essa cópia expirar ou até limpar os dados do navegador.

## Correção proposta

1. Marcar essa cópia local com uma "versão". Quando publicarmos uma alteração de configuração, a versão muda e todos os visitantes passam a receber os dados novos imediatamente, sem depender de esperar 1 hora.
2. Reduzir o tempo de validade da cópia local de 1 hora para 5 minutos, e sempre buscar os dados atualizados em segundo plano, mostrando primeiro a cópia local para o site não ficar lento.

Resultado: o rodapé mostra o telefone novo em qualquer navegador, inclusive nos que já visitaram o site.

## Detalhes técnicos

- `src/contexts/TenantContext.tsx`, função `fetchTenant`:
  - Adicionar constante `TENANT_CACHE_VERSION` gravada junto do payload em `localStorage`; descartar entradas com versão diferente.
  - Baixar TTL de `60 * 60 * 1000` para `5 * 60 * 1000`.
  - Aplicar padrão stale-while-revalidate: usar cache válido para render imediato e, em paralelo, refazer o `select` em `tenants` e atualizar estado/tema/cache se houver diferença.
- Nenhuma mudança em `src/components/ui/footer.tsx` (já consome `tenant.contact_phone`).
- `whatsapp-float.tsx` e `contact_whatsapp` permanecem com `5511956850046`, conforme decidido antes.
