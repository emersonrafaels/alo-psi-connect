

## Ajustes na página Sobre e rodapé

### Alterações

**1. `src/pages/About.tsx` (linha 371)** — Redirecionar "Solicitar demonstração" para o topo da página de contato
- Mudar `navigate(buildTenantPath(tenantSlug, '/contato'))` para incluir scroll to top após navegação, usando `window.scrollTo(0, 0)` após o navigate, ou simplesmente navegando sem hash (já deveria ir ao topo — verificar se há algo impedindo)

**2. `src/pages/About.tsx` (linha 438)** — Corrigir texto
- Trocar `"Base clínica, ética e de privacidade"` por `"Base clínica, ética e privacidade"`

**3. `src/components/ui/footer.tsx` (linhas 109-127)** — Remover coluna Newsletter
- Remover o bloco inteiro do Newsletter (`<div className="lg:col-span-1">` com form)
- Ajustar grid de `lg:grid-cols-5` para `lg:grid-cols-4`
- Remover imports não utilizados: `useNewsletter`, estados `email`/`nome`, `handleNewsletterSubmit`

### Arquivos
- `src/pages/About.tsx` — 2 alterações pontuais
- `src/components/ui/footer.tsx` — remoção da coluna newsletter + cleanup

