# Bandeiras no menu + seção de Tradução no Admin

## 1. Bandeiras no menu
- Tirar a faixa de bandeiras fixa do topo da tela.
- Colocar as bandeiras (Brasil, EUA, Espanha) dentro do menu do site, ao lado do botão de tema claro/escuro, no computador e no menu do celular.
- As telas com cabeçalho próprio (Portal Institucional, Comparador, Triagem, Radar) recebem o mesmo seletor, em versão compacta.

## 2. Seção "Tradução" no Portal Admin
Nova página no menu do admin, com:
- **Lista de textos traduzidos**: cada texto original em português, a tradução automática em inglês e em espanhol, e a página onde ele aparece.
- **Filtros**: por página, por idioma, por situação ("automática", "revisada por humano"), e busca por palavra.
- **Editar tradução**: o admin clica em um texto, escreve como deve aparecer e salva. Essa versão passa a valer para todos os visitantes, no lugar da tradução automática.
- **Glossário de palavras**: regras simples como "Sinal elevado → Elevated signal", que valem em todo o site e também orientam as próximas traduções automáticas.
- **Marcar para revisão**: opção de marcar textos como "precisa revisão humana" e ver só esses.
- Voltar para a tradução automática com um clique.

## 3. Como os visitantes recebem as traduções
- Ordem de prioridade: tradução revisada pelo admin → glossário → tradução automática.
- As traduções passam a ser guardadas no sistema (não só no navegador), então todos compartilham as mesmas e a página carrega mais rápido.
- Correções feitas no admin aparecem para os visitantes no próximo carregamento da página.

## Detalhes técnicos
- Nova tabela `translations` (source_text, source_hash, lang, auto_text, human_text, status auto/reviewed/needs_review, pages text[], updated_by, timestamps). Leitura pública; escrita apenas admin via `has_role`; a função `translate-texts` grava traduções automáticas com service role e registra a página (`location.pathname`).
- Nova tabela `translation_glossary` (term_pt, lang, term_target). Leitura pública, escrita admin. O glossário é injetado no prompt da função e aplicado no cliente.
- `autoTranslate.ts`: ao iniciar, carrega revisões humanas + glossário do idioma (cache em memória/localStorage com versão), consulta a tabela antes de chamar a IA, envia a página atual com cada lote.
- `LanguageFlags` vira componente inline (`variant="menu" | "compact"`) usado em `header.tsx` (desktop e mobile) e nos headers próprios; removido do `App.tsx`.
- Página `src/pages/admin/Translations.tsx` + rota e item no menu admin.
- Atualizar regra do AGENTS.md.
