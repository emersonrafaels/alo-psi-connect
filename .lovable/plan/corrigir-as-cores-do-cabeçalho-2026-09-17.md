# Corrigir as cores do cabeçalho

## Diagnóstico confirmado
- Na página inicial, o cabeçalho está recebendo **fundo transparente** e **texto branco**, deixando os links quase invisíveis sobre o fundo claro.
- O componente usa `--header-bg`, mas esse token não possui valor padrão no tema; quando os dados da marca ainda não carregaram ou falham, o navegador descarta a cor de fundo.
- O texto possui fallback branco, portanto a combinação de falha fica branco sobre branco.
- O carregamento da página não apresenta erro de compilação. A consulta direta das configurações atuais ficou indisponível porque o banco estava temporariamente pausado.

## Correção
1. Definir valores seguros para fundo e texto do cabeçalho nos temas claro e escuro, mantendo contraste mesmo antes de carregar as configurações da instituição.
2. Ajustar a aplicação das cores da marca para usar a cor de texto configurada quando existir e, caso contrário, calcular automaticamente uma cor legível sobre o fundo escolhido.
3. Remover valores antigos opcionais ao trocar de instituição, evitando que as cores de uma marca contaminem outra.
4. Manter as cores personalizadas de cada instituição e a indicação rosa da página ativa.

## Validação
- Conferir a página inicial em tema claro e escuro.
- Conferir cabeçalho durante carregamento, com configuração personalizada e no menu móvel.
- Validar contraste dos links, ícones, logo e botão da conta.
- Confirmar que a compilação permanece sem erros.
