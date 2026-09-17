# Corrigir logo do cabeçalho

## Diagnóstico confirmado
- O cabeçalho voltou a usar fundo configurável por instituição, mas o logo ainda é escolhido apenas pelo tema claro/escuro do site.
- No modo claro, se o cabeçalho estiver com fundo escuro, o componente continua tentando mostrar o logo de fundo claro (`logo_url`). Esse logo pode ficar invisível sobre o cabeçalho e parecer que não carregou.
- O componente também mantém estado de erro da imagem sem resetar quando o tenant ou a URL do logo muda, o que pode deixar o fallback preso após uma falha temporária.
- Não consegui confirmar os valores atuais no banco porque a conexão do Supabase estava temporariamente indisponível; a correção será feita na lógica do cabeçalho para não depender desse dado estar perfeito.

## Correção
1. Fazer o logo do cabeçalho acompanhar o fundo real do cabeçalho, não apenas o tema claro/escuro da página.
2. Quando o cabeçalho tiver fundo escuro, priorizar o logo claro (`logo_url_dark`); quando tiver fundo claro, priorizar o logo colorido/escuro (`logo_url`).
3. Manter fallback seguro: se uma versão do logo não existir, usar a outra antes de cair para o nome da instituição.
4. Resetar o estado de erro da imagem quando o tenant ou a URL do logo mudar.
5. Ajustar os textos da tela de gestão de branding para deixar claro que o logo do cabeçalho depende do fundo do cabeçalho, não só do tema.

## Validação
- Conferir a home com o cabeçalho em modo claro e escuro.
- Confirmar que o logo aparece no cabeçalho sobre fundo roxo/escuro.
- Confirmar que uma falha temporária de carregamento não mantém o logo oculto depois que a URL muda.
- Confirmar que a compilação permanece sem erros.

## Detalhes técnicos
- Arquivo principal: `src/components/TenantBranding.tsx`.
- Possível ajuste de texto/admin: `src/components/admin/config/TenantBrandingConfig.tsx` ou `src/components/admin/TenantEditorModal.tsx`.
- Sem mudança de layout do cabeçalho e sem troca manual de URLs no banco, a menos que a validação mostre URL quebrada.
