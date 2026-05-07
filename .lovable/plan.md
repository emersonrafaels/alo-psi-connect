## Objetivo
Substituir a imagem de compartilhamento social (og:image / twitter:image) pela URL fornecida:
`https://alopsi-website.s3.us-east-1.amazonaws.com/imagens/logo/logo_redebemestar_icon_1.png`

## Alterações em `index.html`
- `og:image` → nova URL S3
- `og:image:secure_url` → nova URL S3
- `twitter:image` → nova URL S3
- Remover `og:image:width` (1200) e `og:image:height` (630), pois a nova imagem é um ícone quadrado, não um banner 1200×630.
- Manter `og:image:type` como `image/png` e `og:image:alt`.

## Observações
- Após publicar, será necessário forçar refresh nos debuggers (Facebook/LinkedIn) para limpar cache.
- O arquivo `public/og-image.png` criado anteriormente pode ser mantido ou removido — não é mais referenciado. Sugiro deixá-lo para não quebrar nada, mas posso remover se preferir.
