## Plano: melhorar indexação no Google

### 1. Corrigir `index.html`
- Alterar `lang="en"` → `lang="pt-BR"`
- Adicionar `<link rel="canonical" href="https://redebemestar.com.br/" />`
- Adicionar JSON-LD `Organization` com nome, URL e logo

### 2. Criar `public/sitemap.xml` via gerador
- Criar `scripts/generate-sitemap.ts` com `BASE_URL = "https://redebemestar.com.br"`
- Incluir rotas públicas indexáveis: `/`, `/sobre`, `/blog`, `/profissionais`, `/agendar`, `/contato`, `/trabalhe-conosco`, `/politica-privacidade`, `/termos-servico`, `/cadastro/tipo-usuario`
- Incluir dinamicamente posts publicados do blog (consulta Supabase)
- Excluir rotas `/medcos/*`, `/admin/*`, `/auth*`, perfis, fluxos privados, `*`
- Adicionar `predev` e `prebuild` no `package.json` para rodar o script

### 3. Atualizar `public/robots.txt`
- Adicionar `Sitemap: https://redebemestar.com.br/sitemap.xml`
- Adicionar `Disallow: /admin/` e `Disallow: /medcos/` no bloco `*`

### 4. Resultado esperado
- Google descobre todas as páginas via sitemap
- Idioma correto detectado (pt-BR)
- Canonical aponta para o domínio oficial
- JSON-LD melhora aparição em SERP (knowledge panel, logo)
- Próximo crawl indexará mais páginas além da home e /medcos