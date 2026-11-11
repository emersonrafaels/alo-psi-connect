# Dois novos perfis: Admin RBE e Coordenação clínica

## O que muda para você
- **Admin RBE**: vê e edita tudo no painel admin e nos portais, **exceto** Configurações do sistema, Emails e Traduções (esses itens somem do menu e as páginas ficam bloqueadas).
- **Coordenação clínica**: vê e edita tudo que é saúde dos alunos, em **todas as instituições**: triagem, histórico de atividades, diário emocional (agregado), escalas, Radar de Permanência, pedidos de apoio/jornada de cuidado, termos críticos, agendamentos e Comparador. Não vê financeiro, blog, tenants, emails, traduções, configurações nem gestão de admins.
- Para a Coordenação clínica os alunos aparecem **sempre como "Aluno #N"**, nunca pelo nome.
- Na página Funções (Roles) do admin, os dois perfis passam a poder ser atribuídos a qualquer conta. Só admin/super admin podem atribuir.

## Etapas
1. Adicionar os perfis `admin_rbe` e `clinical_coordinator` à lista de funções do banco.
2. Atualizar as regras de acesso do banco: Admin RBE recebe as mesmas permissões do admin; Coordenação clínica recebe leitura/edição nas tabelas de saúde dos alunos (triagem, notas, pedidos de cuidado, análises, escalas, Radar) de todas as instituições.
3. Atualizar as funções do servidor que checam admin (`require-admin`, chat institucional, mensagens) para aceitar os novos perfis conforme o escopo.
4. Menu lateral e rotas do admin: definir quais itens cada perfil enxerga; bloquear Configurações, Emails e Traduções para Admin RBE.
5. Portal institucional: permitir que Coordenação clínica escolha qualquer instituição, com anonimização forçada.
6. Testes das regras de quem acessa o quê (um teste por regra) e verificação no navegador.

## Detalhes técnicos
- Migração: `ALTER TYPE app_role ADD VALUE` (em migração separada), depois policies usando `has_role(auth.uid(),'admin_rbe')` em paralelo a `is_admin`; função `is_clinical_staff()` security definer para as tabelas clínicas.
- `useAdminAuth`: nova matriz de permissões por página (`src/features/admin/rolePermissions.ts`) usada por `AdminSidebar` e `ProtectedRoute`.
- Anonimização: o hook de máscara de alunos retorna sempre ativo quando o papel é `clinical_coordinator`.
- Registrar a matriz em `AGENTS.md`.
