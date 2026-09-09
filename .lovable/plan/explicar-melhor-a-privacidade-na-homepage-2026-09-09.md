# Explicar melhor a privacidade na homepage

## Objetivo
A frase atual do card "Privacidade total" — "dados nunca compartilhados com a instituição" — é categórica demais e contradiz a própria explicação da plataforma (que compartilha indicadores agregados e anonimizados). Substituir por uma redação precisa que transmite mais confiança.

## Mudança
Em `src/components/home/HomeRedeBemEstar.tsx` (linha 911), card "Privacidade total" da seção do Buddy no WhatsApp:

- **De:** "Conversas criptografadas e dados nunca compartilhados com a instituição."
- **Para:** "Seus registros individuais permanecem privados. A instituição acessa apenas indicadores agregados e anonimizados, conforme consentimento e regras de privacidade."

Nenhuma outra seção da homepage precisa mudar: a linha 477 ("Visão anonimizada para a instituição...") já é consistente com a nova redação.

## Detalhes técnicos
- Edição pontual de uma string em `src/components/home/HomeRedeBemEstar.tsx`.
- Escopo apenas homepage (tenant Rede Bem-Estar); textos semelhantes na página Sobre e na home Medcos não foram pedidos e permanecem como estão.
