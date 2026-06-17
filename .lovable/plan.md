## Objetivo
Substituir o favicon atual do site pela imagem hospedada no S3.

## O que será feito
1. **Atualizar `index.html`**: Substituir as tags `<link rel="icon">` e `<link rel="apple-touch-icon">` locais pela URL pública do S3:
   ```
   https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_icon_1.png
   ```
2. **Remover favicons antigos**: Deletar os arquivos locais obsoletos do diretório `public/`:
   - `favicon.ico`
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `apple-touch-icon.png`
   - `favicon.png`

## Resultado esperado
O ícone do site (exibido em abas do navegador e resultados do Google) passa a usar a logo oficial da Rede Bem-Estar hospedada no S3.