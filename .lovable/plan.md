## Objetivo
Garantir que, ao clicar em **"Agendar demonstração"** (→ `/contato`) ou **"Conhecer mais / Conhecer profissionais"** (→ `/profissionais`) na Home da Rede Bem-Estar, a página de destino seja aberta já no topo, em vez de manter a posição de scroll anterior.

## Diagnóstico
No arquivo `src/components/home/HomeRedeBemEstar.tsx` (linhas 79–81) existem dois handlers usados por todos os CTAs do Hero, das seções intermediárias e do CTA final:

```ts
const goToContact = () => navigate(buildTenantPath(tenantSlug, "/contato"));
const goToProfessionals = () =>
  navigate(buildTenantPath(tenantSlug, "/profissionais"));
```

Ambos apenas navegam via React Router, sem resetar o scroll — então a página destino herda a posição de rolagem da Home. O mesmo problema ocorre no botão **"Ver Perfil"** (linha 779) do card de profissional em destaque, que navega para `/professional/:id` sem reset.

A regra global do projeto (memória Core) já determina: *"Always reset scroll (`window.scrollTo(0, 0)`) on internal navigation from Homepage/About"*, portanto o ajuste está alinhado ao padrão existente.

## Mudanças propostas

**Arquivo: `src/components/home/HomeRedeBemEstar.tsx`**

1. Atualizar `goToContact` e `goToProfessionals` para resetar o scroll antes/depois do `navigate`:
   ```ts
   const goToContact = () => {
     navigate(buildTenantPath(tenantSlug, "/contato"));
     window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
   };
   const goToProfessionals = () => {
     navigate(buildTenantPath(tenantSlug, "/profissionais"));
     window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
   };
   ```

2. Aplicar o mesmo padrão ao `onClick` do botão **"Ver Perfil"** (linha 779), encapsulando em um handler que navega e em seguida chama `window.scrollTo({ top: 0 })`, mantendo consistência com a regra global.

## Fora do escopo
- Não altera o `HomeMedcos.tsx` nem outras páginas.
- Não modifica o `ScrollToTopButton` nem comportamento de navegação do Header/Footer.
- Não troca textos, estilos ou rotas dos CTAs.

## Validação
- Rolar a Home até o CTA final, clicar em **"Agendar demonstração"** e confirmar que `/contato` abre no topo.
- Rolar até a seção de profissionais em destaque, clicar em **"Conhecer mais"** / **"Ver Perfil"** e confirmar que a página destino abre no topo.
- Verificar build TypeScript (sem novas dependências).