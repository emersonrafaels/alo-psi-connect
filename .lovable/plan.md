# Seletor de idioma (PT / EN / ES) em todo o site

## O que o usuário verá
- No topo do site (cabeçalho público, Meu espaço e Portal Institucional), três bandeiras: Brasil, EUA/Reino Unido e Espanha. A atual fica destacada.
- Ao clicar, todo o site — menus, botões, páginas e também conteúdos cadastrados (encontros, apoios, mensagens, perguntas das escalas e do Radar) — muda para o idioma escolhido, na hora.
- A escolha fica salva no navegador (e no perfil, se logado) e vale nas próximas visitas.
- Português continua sendo o padrão; nada muda para quem não clicar.

## Como funciona
- Tradução automática instantânea: o texto visível da página é traduzido por IA e guardado em cache, então a segunda vez é imediata e sem custo extra.
- Ao navegar ou quando novos conteúdos aparecem, só o texto novo é traduzido.
- Não são traduzidos: nomes próprios da marca (Rede Bem-Estar, Buddy, Alo Psi), rótulos "Aluno #N", emails e números.
- Textos digitados pelo usuário em campos (diário, mensagens) não são alterados enquanto ele escreve.

## Limitações a saber
- Qualidade de tradutor automático; termos clínicos podem precisar de ajuste depois (podemos fixar um glossário, ex.: "Sinal elevado" → "Elevated signal").
- Emails enviados continuam em português nesta etapa.
- Pode haver um piscar breve no primeiro carregamento de uma página nova em outro idioma.

## Detalhes técnicos
- `LanguageProvider` (contexto + localStorage + `profiles.preferred_language`) e componente `LanguageFlags` nos headers existentes.
- `AutoTranslator`: MutationObserver sobre `#root` coleta text nodes e atributos (`placeholder`, `title`, `aria-label`), ignora `input/textarea/[contenteditable]/[data-no-translate]`, envia lotes para Edge Function `translate-texts`.
- Edge Function `translate-texts` usa Lovable AI Gateway (gemini flash) com glossário fixo, retorna JSON por hash.
- Cache em duas camadas: tabela `translation_cache (hash, lang, text)` compartilhada (leitura pública, escrita só pela função) + localStorage.
- `<html lang>` atualizado; datas via `date-fns` locale correspondente.
- Registrar regra no AGENTS.md.
