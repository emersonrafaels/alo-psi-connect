# Etapas Compreender, Regular, Agir e Registro conforme o protótipo

As quatro etapas já existem na Jornada Emocional (`/praticas/jornada`), mas com layout diferente do protótipo enviado. O objetivo é deixá-las iguais aos prints e ao HTML de referência, mantendo o que já funciona (salvamento, paisagem emocional, práticas).

## 2. Compreender — dimensão por dimensão

- Coluna lateral esquerda fixa com as quatro dimensões numeradas: Situação ou fonte de estresse, Corpo, Comportamento e impulso, Pensamentos e diálogo interno — cada uma com o rótulo "Opcional" e destaque na dimensão atual (hoje elas aparecem como pílulas horizontais).
- Painel principal com: selo "Compreender", título da dimensão, texto de apoio, pergunta em negrito, campo de escrita amplo.
- Abaixo do campo: "Ainda não consigo identificar", "Prefiro não registrar agora" e "Limpar".
- Bloco recolhível "Por que observar isso pode ajudar?".
- Rodapé com "Anterior" e "Próxima dimensão" (na última dimensão, segue para Regular).

## 3. Regular — um recurso por vez

- Duas colunas: recurso à esquerda, painel "Autonomia se constrói aos poucos" à direita com os três pontos numerados (Uma prática por vez / Sem prescrição por emoção / Aprendizado pelo histórico).
- Card do recurso: ícone, título, descrição, selo "Recurso novo" ou "Já conhecido", caixa "Por que esta prática aparece agora?" e os passos da prática numerados 1, 2, 3.
- Botões: "Praticar agora", "Continuar sem prática", "Conhecer outro recurso".
- Após praticar: passos ficam marcados em verde, o botão principal vira "Prática concluída" (inativo) mais "Continuar para agir", e aparece "Como este recurso foi para você?" com as opções Não ajudou / Ajudou pouco / Ajudou / Ajudou bastante (em vez da escala numérica atual).

## 4. Agir — três áreas e menor próximo passo

- Textos e exemplos iguais ao protótipo nas três áreas: "Depende de mim", "Posso influenciar", "Não depende de mim".
- Bloco recolhível "Como pensar sobre controle sem se culpar?".
- Bloco "Meu menor próximo passo possível" com campo de texto e seletor "Quando?" (Agora, Hoje, Amanhã, Nesta semana, Sem prazo definido).
- Linha de saídas: "Ainda não sei", "Não quero definir uma ação agora", "Preciso de ajuda para pensar nisso".
- Rodapé: "Voltar" e "Concluir meu registro".

## 5. Registro — resumo e paisagem

- Abertura com o Buddy ao lado do texto "Você transformou um momento em informação para se conhecer melhor" e a nota sobre ocorrências na Paisagem Emocional.
- Faixa de resumo com os números da sessão (emoções, intensidades antes/depois, prática, próximo passo) e cartões por etapa com o que foi escrito.
- Paisagem Emocional com legenda "Tamanho = frequência", "Cor = intensidade", "Contorno = registro de hoje".
- Ações finais: "Salvar na Minha Jornada", "Ver caminhos de apoio" (modal com acolhimento institucional, rede de profissionais, plano de apoio e ajuda imediata), "Fazer novo registro" e "Abrir Paisagem Emocional completa".

## Detalhes técnicos

- Reescrever `ComprehensionDimensions.tsx` (navegação lateral), `LearningResourceCard.tsx` (duas colunas, passos, rótulos de utilidade), `ControlColumns.tsx` (seletor "Quando?" e linha de saídas) e `SessionSummary.tsx` (herói, faixa e cartões).
- Novo componente de modal de apoio, aberto pelo botão "Ver caminhos de apoio".
- Complementar `copy.ts` com os textos do protótipo (perguntas, ajudas, exemplos, rótulos de utilidade e itens de autonomia).
- Cores/tipografia via tokens existentes do projeto; sem alterar `reducer.ts`, tipos, RPCs ou o esquema de dados, exceto acrescentar os rótulos de utilidade já suportados pela escala 1–5.
- Validar em desktop e mobile percorrendo o fluxo completo e conferir o build.
