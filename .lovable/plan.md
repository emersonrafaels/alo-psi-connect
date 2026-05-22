# Atualização do favicon (ícone do Google)

## Objetivo
Garantir que o ícone exibido nos resultados de busca do Google e na aba do navegador seja o logo oficial da Rede Bem-Estar, servido a partir do próprio domínio (favicons externos via S3 podem ser ignorados pelo Google).

## Mudanças

### 1. Baixar o logo oficial para `public/`
- Baixar `https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/logos/logo_redebemestar_icon_1.png`
- Salvar como `public/favicon.png` (versão principal, alta resolução)
- Gerar também `public/favicon-32x32.png` e `public/favicon-16x16.png` (tamanhos otimizados para o Google)
- Substituir o `public/favicon.ico` existente por uma nova versão gerada a partir do logo (browsers ainda requisitam `/favicon.ico` por padrão)

### 2. Atualizar `index.html`
Substituir a linha 39 (favicon apontando para URL externa do S3) por referências locais:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon.png">
```

## Por que isso resolve o problema do Google
- O Google prefere favicons servidos no mesmo domínio do site (`/favicon.ico` na raiz).
- Favicons hospedados em CDN externa (S3) frequentemente são ignorados ou demoram a aparecer.
- Múltiplos tamanhos garantem renderização correta em diferentes contextos (SERP, aba, bookmark, mobile).

## Observação
Após o deploy, o Google pode levar de alguns dias a algumas semanas para atualizar o favicon nos resultados de busca — isso depende do próximo rastreamento do site.
