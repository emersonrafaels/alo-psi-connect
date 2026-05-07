Atualizar a imagem de compartilhamento social para que o preview mostre corretamente o logo oficial da Rede Bem Estar, sem corte estranho ou aparência “lavada”. O logo solicitado continuará sendo exatamente este:

`https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_2.png`

## O que vou fazer

1. Criar uma imagem própria para compartilhamento social em formato adequado para Open Graph/Twitter Card.
   - Usarei o logo oficial acima como elemento principal.
   - A imagem será montada em proporção social padrão (ex.: 1200x630), com fundo e margens adequados para WhatsApp, Facebook e LinkedIn.
   - Isso evita o problema atual de recorte/zoom estranho no preview.

2. Atualizar as meta tags em `index.html`.
   - Trocar `og:image` e `twitter:image` para apontarem para essa nova imagem de compartilhamento.
   - Adicionar metadados complementares como `og:image:width`, `og:image:height`, `og:image:type` e `og:image:alt`.
   - Garantir consistência com o domínio público `https://redebemestar.com.br`.

3. Verificar o HTML publicado.
   - Confirmar que a página publicada expõe a nova imagem nas meta tags.
   - Confirmar que o preview social passa a usar um asset adequado, em vez do PNG de logo “solto”.

## Por que isso é necessário

Hoje o site já está apontando exatamente para o logo que você mandou, então o problema não é “logo errado”. O problema é o formato do arquivo usado como `og:image`:

- o arquivo atual é um PNG horizontal com fundo transparente
- dimensões atuais: `1027 x 231`
- redes sociais esperam uma imagem de preview mais próxima de um banner/cartão, normalmente `1200 x 630`

Por isso, LinkedIn/WhatsApp/Facebook ampliam ou enquadram essa imagem de forma ruim, o que gera esse visual estranho no compartilhamento.

## Detalhes técnicos

Arquivos e pontos de ajuste previstos:

- `index.html`
  - atualizar `og:image`
  - atualizar `twitter:image`
  - adicionar propriedades extras de Open Graph

- `public/` ou outro caminho estático equivalente
  - adicionar a nova imagem social otimizada para compartilhamento

Padrão da nova imagem:

```text
1200 x 630
+----------------------------------------------+
|                                              |
|              logo Rede Bem Estar             |
|         com respiro e fundo da marca         |
|                                              |
+----------------------------------------------+
```

## Resultado esperado

Ao compartilhar `https://redebemestar.com.br`, o preview deverá:

- mostrar o logo correto da Rede Bem Estar
- aparecer centralizado e legível
- evitar corte excessivo, fundo transparente problemático e efeito “estranho” no card

Se você aprovar, eu implemento essa correção agora.