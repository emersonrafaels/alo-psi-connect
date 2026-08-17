# Correção dos logos: email e rodapé

## O que está errado

Existem duas variantes do logo no S3 (`rede_bem_estar/imagens/logos/`):

- `logo_redebemestar_1.png` — texto roxo/rosa, feito para fundo claro
- `logo_redebemestar_2.png` — texto branco, feito para fundo escuro

Hoje elas estão trocadas nos dois pontos das imagens:

1. **Email "Sua sugestão foi recebida"** — o template tem fundo branco, mas usa o logo de texto branco (`logo_url` = `..._2.png`), então as letras desaparecem.
2. **Rodapé do site** — o fundo é roxo, mas o rodapé usa `footer_logo_url` = `..._1.png` (texto roxo), então as letras somem no fundo roxo.

Os outros emails (cadastro, senha, encontros, vínculo institucional) colocam o logo dentro de um cabeçalho colorido, então neles o logo branco está correto e não deve mudar.

## Correções

### 1. Rodapé (apenas dados, sem código)
Atualizar o tenant `alopsi` (Rede Bem-Estar): `footer_logo_url` passa a apontar para `logo_redebemestar_2.png` (texto branco), igualando ao `footer_logo_url_dark`. O componente de rodapé já busca esse campo — nenhuma mudança de layout necessária.

### 2. Email de sugestão de tema
Em `supabase/functions/suggest-session-theme/index.ts`, o email de confirmação ao usuário passa a usar a versão de texto escuro do logo, já que o fundo é branco. Para isso a função passa a ler também `footer_logo_url`/`feature_logo_url` do tenant e escolher, na ordem: `feature_logo_url` (variante para fundo claro) → `logo_url`. No tenant Rede Bem-Estar o `feature_logo_url` já é a versão de letras escuras.

Alternativa (se preferir controle total pelo admin): criar um campo `email_logo_url` no tenant com input no editor de tenants. Isso adiciona configuração para todos os emails, mas é mais trabalho; por padrão sigo a opção acima.

### 3. Verificação
- Renderizar o HTML do email localmente com o logo escolhido e confirmar contraste no fundo branco.
- Conferir o rodapé no preview (modo claro e escuro) para garantir o logo branco legível sobre o roxo.

## Detalhes técnicos
- Arquivos afetados: `supabase/functions/suggest-session-theme/index.ts` (seleção do logo + `select` do tenant) e uma migration/update em `tenants.footer_logo_url`.
- Sem mudanças em `src/components/ui/footer.tsx` — a lógica de fallback já é adequada.
- Deploy da edge function após a edição.
