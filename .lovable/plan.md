# Radar Institucional Público

Permitir que instituições ainda não cadastradas na Rede Bem-Estar preencham o Radar Institucional sem precisar de login, mantendo o fluxo autenticado atual intacto.

## O que muda para o usuário

- Nova rota pública: `/radar-institucional` (acessível sem login), com o mesmo formulário multi-etapa já existente.
- Página inicial pública explica o que é o Radar, quanto tempo leva (~10 min), o que a IES recebe ao final (leitura estratégica + recomendações) e um CTA "Iniciar diagnóstico".
- A etapa "Identificação da instituição" passa a coletar também: nome da IES, tipo (pública/privada), porte, cidade/UF, site e dados do respondente (nome, cargo, e-mail, telefone) — já existentes, mas agora obrigatórios no fluxo público.
- Ao submeter, o respondente vê a leitura estratégica na hora e recebe um e-mail com o link permanente do resultado (token na URL).
- No admin, esses radares públicos aparecem na mesma lista de `/admin/radar-institucional`, marcados com um badge "Pendente de vínculo". O admin pode então vincular o radar a uma `educational_institutions` existente ou catalogar uma nova (reaproveitando o fluxo de "instituições não catalogadas" que já existe).
- Fluxo autenticado atual do Portal Institucional segue igual.

## Como funciona por trás

### Banco (migração)
Ajustes em `institution_radar_diagnostics`:
- `institution_id` passa a ser **nullable** (hoje é obrigatório).
- Novos campos: `submission_source` (`'authenticated' | 'public'`, default `'authenticated'`), `public_access_token` (uuid, único, gerado no insert público), `submitted_institution_name`, `submitted_institution_type`, `submitted_institution_city`, `submitted_institution_state`, `submitted_institution_website`.
- Nova policy RLS: **INSERT público** permitido para `anon` **apenas quando** `submission_source = 'public'` e `institution_id IS NULL` (com rate-limit leve por IP via edge function, ver abaixo).
- Nova policy RLS: **SELECT público** apenas via função `security definer` `get_radar_by_token(token uuid)` — não expõe listagem.
- GRANTs: `INSERT` em `institution_radar_diagnostics` para `anon`; `EXECUTE` na função de token para `anon`.
- Admins continuam com acesso total; portal institucional autenticado segue lendo pelo `institution_id`.

### Edge functions
- **Nova** `radar-public-submit`: recebe o payload do formulário público, valida campos obrigatórios, faz rate-limit por IP (via tabela leve ou cabeçalho), insere o diagnóstico com `submission_source='public'` e token, dispara `radar-institutional-analyze` e devolve `{ token, id }`. Usa `service_role` internamente para bypass de RLS controlado.
- **Ajuste** em `radar-institutional-analyze`: aceitar diagnóstico sem `institution_id`, usando `submitted_institution_name` no prompt.
- **Nova** `radar-public-send-email`: envia e-mail via Resend (remetente `noreply@redebemestar.com.br`, memória Core) com o link `https://redebemestar.com.br/radar-institucional/resultado/{token}`.

### Frontend
- **Nova página** `src/pages/public/PublicRadar.tsx`: landing + formulário. Reaproveita `RadarForm` com prop nova `mode: 'public' | 'authenticated'` que:
  - Exibe etapa extra de identificação da IES no início.
  - Chama a edge function `radar-public-submit` em vez do hook autenticado.
  - Ao concluir, redireciona para `/radar-institucional/resultado/{token}`.
- **Nova página** `src/pages/public/PublicRadarResult.tsx`: busca por token via RPC pública e renderiza o `RadarResult` já existente.
- **Ajuste** em `src/components/radar/RadarForm.tsx`: suportar o modo público (identificação obrigatória, sem dependência de `institutionId`).
- **Ajuste** em `src/pages/admin/RadarInstitutional.tsx`: badge "Pendente de vínculo" + ação "Vincular à instituição" (abre dialog com busca em `educational_institutions` ou opção "Catalogar como nova", chamando a mesma edge function `normalize-institutions` já usada em `useUncataloguedInstitutions`).
- **Rotas** em `src/App.tsx`: `/radar-institucional` e `/radar-institucional/resultado/:token` públicas (fora de `ProtectedRoute`).
- **Link público** discreto no rodapé/menu do site institucional (opcional — confirmar).

## Detalhes técnicos

- Rate-limit: 3 submissões por IP a cada 24h na edge `radar-public-submit`, usando tabela `professional_registration_attempts` como referência de padrão (ou nova `radar_public_attempts` se preferir isolar).
- Token: `gen_random_uuid()`, armazenado em `public_access_token`, usado como URL param. Sem expiração (memória do produto valoriza persistência).
- SEO: `<title>` "Radar Institucional — Diagnóstico gratuito | Rede Bem-Estar" e meta description específica na página pública.
- Ao vincular um radar público a uma `educational_institutions`, o admin atualiza `institution_id` e mantém os campos `submitted_*` como histórico da submissão.

## Fora de escopo

- Registro automático da IES como cliente após submissão.
- Dashboard analítico agregando radares públicos vs. autenticados (pode virar melhoria futura).
