Atualizar `index.html` para usar o logo oficial da Rede Bem Estar (mesmo do tenant no banco) nas meta tags de compartilhamento social.

## Alteração

Em `index.html`, trocar as duas referências da imagem antiga do `storage.googleapis.com` pela URL do logo Rede Bem Estar:

`https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_2.png`

- Linha 23: `<meta property="og:image" ...>`
- Linha 27: `<meta name="twitter:image" ...>`

## Observação

Após publicar, caches de WhatsApp/Facebook/LinkedIn ainda mostrarão o logo antigo. Para forçar atualização:
- Facebook/WhatsApp: https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/