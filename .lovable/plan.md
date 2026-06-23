## Objetivo
No header da sessão de prática (`PraticaSessao.tsx`, linha 502), substituir o texto fixo "Rede Bem-Estar" pelo logo do tenant atual.

## Mudanças

**`src/pages/praticas/PraticaSessao.tsx`**
- Importar `useTenant` de `@/hooks/useTenant`.
- Obter `tenant` no componente.
- Trocar `<p className="font-serif text-base sm:text-lg opacity-90">Rede Bem-Estar</p>` por:
  - Se `tenant.logo_url_dark` ou `tenant.logo_url` existir: `<img src={tenant.logo_url_dark || tenant.logo_url} alt={tenant.name} className="h-8 sm:h-10 w-auto object-contain opacity-90" />` (preferindo a versão dark, já que o fundo da sessão é escuro/colorido).
  - Fallback: manter o texto atual com `tenant?.name || "Rede Bem-Estar"`.

Nenhuma outra alteração — escopo puramente visual no header da sessão.