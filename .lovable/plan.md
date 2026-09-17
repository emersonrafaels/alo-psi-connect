# Botão "Voltar ao Portal Institucional" na Biblioteca de Apoios

## Contexto
Na página de Apoios do portal institucional (`src/pages/institution/InstitutionSupports.tsx`, linha ~245) existe o botão **"Ver como o aluno"** que navega para `/biblioteca-apoios`. Hoje, ao chegar lá, não há como retornar ao portal institucional. O usuário quer um botão de voltar visível na biblioteca de apoios quando veio do portal.

## Mudanças

### 1. Passar a origem ao navegar — `src/pages/institution/InstitutionSupports.tsx`
No `Link` do botão "Ver como o aluno" (linha ~246), adicionar `state={{ from: 'institution-portal' }}`:
```tsx
<Link to={buildTenantPath(tenant?.slug, "/biblioteca-apoios")} state={{ from: 'institution-portal' }}>
  <Eye className="h-4 w-4 mr-2" /> Ver como o aluno
</Link>
```

### 2. Exibir botão de voltar — `src/pages/apoios/BibliotecaApoios.tsx`
- Ler `location.state` (já há `const location = useLocation()` na linha 77): `const fromPortal = location.state?.from === 'institution-portal'`.
- Logo abaixo do `<Header />`, no topo do `<main>`, quando `fromPortal` for verdadeiro, renderizar um botão de voltar:
```tsx
{fromPortal && (
  <Button variant="outline" asChild className="mb-2">
    <Link to={`${basePath}/portal-institucional/apoios`}>
      <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Portal Institucional
    </Link>
  </Button>
)}
```
- Importar `ArrowLeft` de `lucide-react` (já importa outros ícones do mesmo pacote).
- `basePath` já está disponível (linha 78) e respeita o tenant (Medcos vs. principal), então o destino fica correto nos dois domínios.

## Notas técnicas
- Uso de `location.state` (React Router) em vez de query string mantém a URL limpa e funciona no fluxo normal de clique. Se o usuário recarregar a página o estado se perde — aceitável, pois o botão "Ver como o aluno" é a única entrada e o recarregamento é raro neste fluxo.
- O botão só aparece quando a origem foi o portal institucional, então alunos comuns que acessam `/biblioteca-apoios` diretamente não o veem.
- Nenhum back-end ou alteração de banco necessária.
