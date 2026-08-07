# Documento Word — Respostas para Registro de Software (INPI)

Gerar um arquivo `.docx` para download respondendo, item por item (a–i), as confirmações solicitadas para o registro do software Rede Bem-Estar.

## Conteúdo do documento

Capa curta + tabela/seções com as respostas:

- **a. Título do software:** Rede Bem-Estar (plataforma de cuidado e acompanhamento em bem-estar)
- **b. Código fonte em hash:** gerar hash **SHA-512** de um pacote consolidado do código-fonte (excluindo `node_modules`, `.git`, builds e arquivos de ambiente), informando o algoritmo, o hash e a lista/contagem de arquivos considerados
- **c. Termos de Cessão:** campo indicando que deve ser anexado pela empresa; incluir a orientação de que não exige cartório (não há documento assinado no projeto para anexar)
- **d. Data de publicação:** data em que a plataforma passou a ser acessível ao público — a confirmar com você
- **e. Data de criação:** data de início do desenvolvimento — a confirmar com você
- **f. Campo de aplicação:** saúde mental e bem-estar; setor de educação (instituições de ensino) e saúde
- **g. Tipo:** aplicativo web (SaaS multi-tenant) com backend gerenciado e integrações
- **h. Linguagem:** TypeScript / JavaScript (React + Vite), HTML5, CSS, SQL (PostgreSQL); funções serverless em TypeScript (Deno)
- **i. Derivado de outro software registrado:** não; utiliza bibliotecas open source de terceiros (React, Vite, Tailwind, Radix UI, Supabase SDK, Mercado Pago SDK) sem constituir derivação de software registrado

Seção final opcional: resumo funcional do sistema (agendamentos, diário emocional, práticas, escalas, portal institucional, Buddy, pagamentos via Mercado Pago) — útil como descrição técnica no processo.

## Detalhes técnicos

- Geração via biblioteca `docx` (Node), fonte Arial, US Letter, tabelas com larguras em DXA.
- Hash calculado no sandbox com `sha512sum` sobre um tar determinístico do fonte versionado.
- Saída em `/mnt/documents/Registro_Software_RedeBemEstar.docx`, entregue como artefato para download.
- QA: converter o docx em imagens e revisar todas as páginas antes de entregar.

## Pendências que preciso de você

Datas de criação e de publicação, e o nome da empresa titular. Se preferir, deixo esses campos marcados como "[preencher]" no documento.
