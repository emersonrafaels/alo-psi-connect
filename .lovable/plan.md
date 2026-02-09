

## Plano: Unificar "Encontros" no Menu do Usuario

### Contexto

Atualmente, o menu do usuario exibe dois itens separados:
- "Meus Encontros" (visivel para todos)
- "Gerenciar Encontros" (visivel apenas para facilitadores)

A proposta e unificar isso em um unico item "Encontros" para usuarios com perfil privilegiado (profissional, admin, ou roles especificas), levando a uma pagina com abas.

### Quem e afetado

**Usuarios que verao "Encontros" (com aba "Criar Encontro"):**
- User types: `profissional`, `admin`
- Roles: `author`, `super_author`, `super_admin`, `institution_admin`, `facilitator`

**Demais usuarios (pacientes sem roles especiais):**
- Continuam vendo "Meus Encontros" como esta hoje, sem a aba de criacao.

---

### Mudancas

#### 1. Header (`src/components/ui/header.tsx`)

- Adicionar verificacao combinada: se o usuario tem tipo `profissional`/`admin` OU alguma das roles especiais, exibir "Encontros" no menu
- Remover o item separado "Gerenciar Encontros" (sera absorvido pela aba)
- Para usuarios comuns, manter "Meus Encontros" apontando para `/meus-encontros`
- Para usuarios privilegiados, "Encontros" aponta para `/meus-encontros` (mesma rota, pagina diferenciada)
- Aplicar tanto no dropdown desktop quanto no menu mobile

#### 2. Pagina MyGroupSessions (`src/pages/MyGroupSessions.tsx`)

- Adicionar verificacao de tipo/role do usuario
- Se usuario privilegiado: exibir pagina com duas abas
  - **Tab "Meus Encontros"**: conteudo atual (proximos + passados)
  - **Tab "Criar Encontro"**: formulario de criacao (reutilizando `FacilitatorSessionForm`) + lista de encontros criados pelo usuario (reutilizando logica do `ManageGroupSessions`)
- Se usuario comum: manter layout atual sem abas extras
- O titulo da pagina muda de "Meus Encontros" para "Encontros" quando privilegiado

#### 3. Hooks necessarios

- Usar `useUserType` para verificar `profissional`/`admin`
- Usar `useUserRole` para verificar as roles `author`, `super_author`, `super_admin`, `institution_admin`, `facilitator`
- Criar uma verificacao combinada simples inline (sem novo hook)

---

### Secao Tecnica

#### Logica de verificacao (inline no componente)

```typescript
const { isProfessional } = useUserType();
const { hasRole: isAdmin } = useUserRole('admin');
const { hasRole: isSuperAdmin } = useUserRole('super_admin');
const { hasRole: isAuthor } = useUserRole('author');
const { hasRole: isSuperAuthor } = useUserRole('super_author');
const { hasRole: isInstitutionAdmin } = useUserRole('institution_admin');
const { hasRole: isFacilitator } = useUserRole('facilitator');

const canCreateSessions = isProfessional || isAdmin || isSuperAdmin 
  || isAuthor || isSuperAuthor || isInstitutionAdmin || isFacilitator;
```

#### Estrutura da aba "Criar Encontro"

Reutilizar a logica ja existente em `ManageGroupSessions.tsx`:
- Query `facilitator-sessions` para listar encontros do usuario
- Mutation de criacao com status `pending_approval`
- Mutation de exclusao de encontros pendentes
- Dialog com `FacilitatorSessionForm`

#### Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/ui/header.tsx` | Trocar "Meus Encontros" por "Encontros" para usuarios privilegiados; remover item "Gerenciar Encontros" separado |
| `src/pages/MyGroupSessions.tsx` | Adicionar tabs com "Meus Encontros" e "Criar Encontro"; integrar logica do ManageGroupSessions |

#### Rota `/gerenciar-encontros`

Sera mantida funcionando como redirect ou acesso direto, mas o item do menu nao apontara mais para ela. O `ManageGroupSessions.tsx` permanece inalterado como fallback.

---

### Ordem de implementacao

1. Modificar `MyGroupSessions.tsx` para suportar as duas abas condicionalmente
2. Modificar o header (desktop + mobile) para exibir "Encontros" ou "Meus Encontros" conforme o perfil

