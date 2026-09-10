# Gerenciar Apoios no menu do usuário (dropdown do admin)

## Objetivo
Ao clicar no próprio nome (canto superior direito), o admin passa a ver também a opção **Gerenciar Apoios** no menu suspenso, levando à página de gestão da biblioteca (`/admin/biblioteca-apoios`).

## Mudança
Em `src/components/ui/header.tsx`:

1. **Menu suspenso (desktop)** — dentro do bloco `{isAdmin && (...)}` ao lado de "Acessar Admin", adicionar item:
   - Ícone `HeartHandshake`
   - Texto "Gerenciar Apoios"
   - Navega para `/admin/biblioteca-apoios`

2. **Menu mobile** — no bloco `{isAdmin && (...)}` equivalente (junto de "Acessar Admin"), adicionar o mesmo link "Gerenciar Apoios" → `/admin/biblioteca-apoios`, com o mesmo ícone e padrão visual dos demais itens.

3. Garantir a importação do ícone `HeartHandshake` do `lucide-react`.

## Observações
- Nenhum item existente é removido ou renomeado.
- Visível apenas para quem tem papel de admin, mesmo critério de "Acessar Admin".
- A página de destino (`SupportLibraryAdmin`) já existe e funciona; é apenas o atalho no menu que será adicionado.
