# Corrigir o logo do rodapé

## Diagnóstico confirmado no código
- O rodapé só mostra imagem quando encontra `footer_logo_url`, `footer_logo_url_dark`, `logo_url` ou `logo_url_dark` no tenant.
- Diferente do cabeçalho corrigido, o rodapé ainda não possui fallback estático para a Rede Bem-Estar quando esses campos não chegam ou estão vazios.
- A escolha do logo do rodapé hoje depende do tema claro/escuro da página, mas o fundo do rodapé pode continuar roxo no tema claro. Isso pode fazer a versão errada do logo ficar invisível sobre o fundo.

## Correção
1. Ajustar o rodapé para escolher a versão do logo conforme o fundo real do rodapé, não apenas conforme o tema da página.
2. Usar a versão branca do logo da Rede Bem-Estar como fallback quando o rodapé estiver com fundo roxo/escuro.
3. Usar a versão para fundo claro apenas se o rodapé estiver configurado com fundo claro.
4. Manter os logos configurados pelo admin como prioridade, antes dos fallbacks padrão.
5. Se todas as imagens falharem, mostrar o nome da marca em texto para não deixar o espaço vazio.

## Validação
- Conferir o rodapé na página inicial em tema claro.
- Conferir o rodapé em tema escuro.
- Confirmar que a imagem carrega e fica legível sobre o fundo do rodapé.
- Confirmar que o cabeçalho continua com o logo correto.
- Confirmar que o preview permanece sem erros.

## Detalhes técnicos
- Arquivo principal: `src/components/ui/footer.tsx`.
- Reaproveitar a lógica de luminância já usada no cabeçalho, com as URLs oficiais dos logos da Rede Bem-Estar.
- Não alterar dados do banco enquanto o Supabase estiver indisponível.
