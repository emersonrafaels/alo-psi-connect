
## Objetivo

Adicionar no Buddy uma aba "Privacidade" onde o estudante decide, tema por tema, o que compartilha com os profissionais que o atendem — seguindo o layout de referência (tabela com toggles + timestamp de consentimento + aviso LGPD + ações de confirmar/revisar).

## Onde entra

- Novo item no menu lateral do `BuddyLayout` (`src/components/buddy/BuddyLayout.tsx`): "Privacidade" (ícone `Shield`), rota `/buddy/privacidade`.
- Nova página `src/pages/buddy/BuddyPrivacy.tsx` registrada em `src/App.tsx` dentro de `ProtectedRoute`.

## Layout da página (baseado na imagem)

Cabeçalho:
- Título: "Compartilhamento e privacidade"
- Subtítulo: "Aqui você vê exatamente o que está permitindo que seus profissionais vejam. Você decide o que compartilhar."

Card principal — tabela "Resumo do que será compartilhado":

Colunas: Tema | Compartilhar com meu psicólogo | Compartilhar com meu psiquiatra | Guardar só para mim | Remover

Linhas (usando a nomenclatura real do Retrato do Buddy hoje):
- O que ocupa minha mente (`mind_on`)
- O que me acalma (`calms_me`)
- Meus sonhos e planos (`dreams`)
- Meus valores (`values_list`)
- Meus gatilhos (`triggers`)
- O que quero melhorar (`wants_to_improve`)
- Mensagem livre para o Buddy (`message_to_buddy`)

Regras de UI:
- "Guardar só para mim" e as duas colunas de compartilhamento são mutuamente exclusivas por linha (radio-like via Switches controlados).
- "Remover" apaga o conteúdo daquele campo no `buddy_portraits` (confirmação via `AlertDialog`).
- Ícone `Info` por tema com tooltip explicando o que é compartilhado.

Rodapé do card:
- Bloco "Consentimento registrado em: {data/hora}" com nome do estudante (do `profiles.nome`).
- Bloco "Seus dados estão protegidos pela LGPD. Compartilhamos apenas o que você autorizar. Você pode mudar suas escolhas quando quiser."

Ações:
- Botão secundário "Revisar respostas" → navega para `/buddy/me-conhecer`.
- Botão primário "Confirmar compartilhamento" → salva o snapshot atual e atualiza `consent_registered_at`.

Sidebar direita (fora do card, seguindo a arte):
- Mascote `BuddyMascot` + card com "Você pode mudar isso a qualquer momento. Seu bem-estar é prioridade. Você está no controle."

## Backend

Nova tabela `buddy_privacy_preferences` (uma linha por estudante, JSON por tema):

```
buddy_privacy_preferences
  id uuid pk
  user_id uuid unique fk profiles.user_id (auth.uid())
  preferences jsonb   -- { mind_on: {psicologo:bool, psiquiatra:bool, private:bool}, ... }
  consent_registered_at timestamptz
  created_at, updated_at timestamptz
```

- RLS: dono (auth.uid()) faz SELECT/INSERT/UPDATE/DELETE. Profissionais leem via política que confere se existe agendamento aceito entre `profissionais.profile_id → profiles.user_id` desse estudante (`user_is_professional` + join em `agendamentos`).
- GRANT `SELECT, INSERT, UPDATE, DELETE` para `authenticated`; `ALL` para `service_role`.
- Trigger `update_updated_at_column` para `updated_at`.

A tabela existente `buddy_professional_consent` (scope genérico) fica intocada; a nova cobre o modelo por tema.

## Novos hooks

`src/hooks/useBuddyPrivacy.tsx`:
- `useBuddyPrivacy()` — lê `buddy_privacy_preferences` do usuário logado.
- `useUpdateBuddyPrivacy()` — upsert do jsonb.
- `useConfirmBuddyPrivacy()` — upsert com `consent_registered_at = now()`.
- `useRemoveBuddyPortraitField(field)` — `UPDATE buddy_portraits SET <field> = null` para o `patient_id` do usuário (já resolvido pelo hook existente `useBuddyPortrait`).

## Fora do escopo

- Escolher profissional específico (mantém as duas categorias fixas: psicólogo e psiquiatra, como na imagem).
- Auditoria histórica dos consentimentos (só guarda o snapshot atual + timestamp).
- Alterar `buddy_professional_consent` existente.

## Passos

1. Migration: criar `buddy_privacy_preferences` com GRANTs, RLS, policies e trigger de `updated_at`.
2. Criar hook `useBuddyPrivacy.tsx`.
3. Criar página `src/pages/buddy/BuddyPrivacy.tsx` com a tabela, ações e mascote.
4. Adicionar item "Privacidade" no `BuddyLayout` (ícone `Shield`, já importado).
5. Registrar rota `/buddy/privacidade` em `src/App.tsx`.
6. Validar build.
