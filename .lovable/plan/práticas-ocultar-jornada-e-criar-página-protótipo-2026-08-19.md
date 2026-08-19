# Práticas: ocultar Jornada e criar página protótipo

## O que muda

1. **`/praticas` (página pública atual)**: o card "Jornada de Autorregulação" deixa de aparecer. O restante da página continua igual.
2. **Nova página `/praticas-prototipo`**: cópia da página de Práticas atual, mantendo o card com o link "Iniciar jornada". Não fica linkada no menu — acesso apenas por URL direta.
3. **Badge do card**: "NOVO · PROTÓTIPO" passa a ser apenas "NOVO".

## Detalhes técnicos

- Criar `src/pages/praticas/PraticasPrototipo.tsx` como cópia de `PraticasIndex.tsx`, mantendo a seção da Jornada e alterando o texto do Badge para "Novo". Título do documento diferenciado ("Práticas (protótipo) | Rede Bem-Estar") e `<meta name="robots" content="noindex">` não é necessário — a rota só é acessível por link direto.
- Remover a seção do card da Jornada em `PraticasIndex.tsx` (linhas 133-160), sem tocar nas outras seções.
- Em `src/App.tsx`, adicionar as rotas `/praticas-prototipo` e `/medcos/praticas-prototipo` apontando para o novo componente. As rotas `/praticas/jornada` existentes permanecem funcionando.
