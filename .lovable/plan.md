# Bandeiras reais e troca de idioma sem recarregar

## O que muda para o usuário
- As letras "BR / US / ES" viram desenhos de bandeira de verdade (Brasil, EUA, Espanha), iguais em qualquer computador, inclusive Windows.
- Ao clicar em uma bandeira, a página não recarrega mais: o texto troca no lugar, com um leve efeito de esmaecer, mantendo a posição da tela, formulários preenchidos e menus abertos.
- Voltar para português é instantâneo (o texto original fica guardado).
- Textos já traduzidos antes aparecem na hora; só textos novos levam alguns instantes, sem piscar a página.
- Pequeno indicador de carregamento na bandeira escolhida enquanto termina de traduzir.

## Detalhes técnicos
- Novo `src/features/i18n/flags.tsx` com bandeiras em SVG inline (sem emoji, sem arquivos externos).
- `autoTranslate.ts` vira um controlador único com `setLanguage(lang)`: guarda o texto original de cada nó/atributo, restaura ao trocar e reaplica o novo idioma sem `location.reload()`; caches separados por idioma carregados sob demanda.
- Pré-aquecimento: após a primeira página, busca em segundo plano as traduções já salvas no banco para o outro idioma, deixando a troca imediata.
- Transição suave via classe no `<html>` (opacity em `#root` por ~150 ms, só durante a troca).
- `LanguageFlags` e `AutoTranslateRunner` passam a usar um pequeno store compartilhado (estado reativo), para todas as bandeiras na tela atualizarem juntas.
