# Práticas para Reequilíbrio Emocional

Nova seção pública do site (não exige login) com 8 práticas guiadas curadas, agrupadas em 3 categorias. Inclui player guiado com animação + áudio, check-out emocional opcional ao final, tela de conclusão e CMS no admin.

## Telas (rotas)

| Rota | Tela | Referência |
|---|---|---|
| `/praticas` | Landing — hero, "Encontrar o que preciso agora", 3 grupos com 8 cards | HTML 2 + 3 |
| `/praticas/:slug` | Detalhe da prática — descrição, ciência, configurações (duração, som) | HTML 1 |
| `/praticas/:slug/sessao` | Player guiado em tela cheia — círculo de respiração + áudio + timer | HTML 6 |
| `/praticas/:slug/checkout` | Check-out emocional — 5 estados + nota opcional | HTML 4 |
| `/praticas/:slug/concluida` | Sessão concluída — resumo, ciência, compartilhar | HTML 5 |

Fluxo: landing → detalhe → sessão → check-out → concluída → volta para `/praticas`.

## Conteúdo inicial (8 práticas, 3 grupos)

- **Regular agora**: Respiração lenta ritmada (5min), Respiração abdominal (3min), Voltar ao presente pela respiração (4min), Quick Coherence (5min)
- **Soltar o corpo**: Soltar a tensão do corpo (12min), Criar um espaço interno de calma (15min)
- **Acolher e desacelerar**: Pausa de autocompaixão (8min), Desaceleração profunda (15min)

Atalhos da seção "Encontrar o que preciso agora" (chips) já mapeiam para práticas específicas.

## Modelo de dados (Supabase, editável pelo admin)

Tabelas novas no schema `public` (com GRANTs e RLS — leitura pública, escrita só admin via `has_role`):

- **`praticas_grupos`**: `slug`, `nome`, `descricao`, `ordem`, `ativo`
- **`praticas`**: `slug` (único), `grupo_id` (fk), `titulo`, `subtitulo`, `descricao_curta`, `corpo_ciencia` (markdown), `icone` (nome material symbol), `duracao_min_default`, `duracoes_disponiveis` (int[]), `ideal_para` (text), `categoria_badge` (text — ex: "EVIDÊNCIA"), `audio_url` (text, nullable), `tem_audio` (bool), `padrao_respiracao` (jsonb — ex: `{inspirar:4, segurar:0, expirar:6}`), `ordem`, `ativo`, `destaque` (bool)
- **`praticas_atalhos`**: chips de "Encontrar o que preciso agora" — `texto`, `pratica_slug`, `ordem`
- **`praticas_checkouts`**: registros do check-out — `pratica_id`, `user_id` (nullable, só preenchido se logado), `estado` (`calmo|energizado|leve|reflexivo|igual`), `nota`, `duracao_segundos`

RLS:
- `praticas_grupos`, `praticas`, `praticas_atalhos`: `SELECT` público (anon + authenticated) quando `ativo=true`; `INSERT/UPDATE/DELETE` apenas para `has_role(auth.uid(),'admin')` ou `'super_admin'`.
- `praticas_checkouts`: `INSERT` público (anon e authenticated); `SELECT` apenas para o próprio `user_id` ou admin. Edge function `submit-pratica-checkout` registra (com service role) para evitar problemas de RLS quando anon.

Migração faz seed inicial das 8 práticas + 3 grupos + 5 atalhos (textos extraídos das HTMLs de referência).

## Áudio das práticas

- Coluna `audio_url` aponta para arquivo no Supabase Storage (bucket público novo `praticas-audio`) ou URL externa.
- Admin pode fazer upload do MP3 na tela de edição da prática.
- Player usa `<audio>` HTML5 sincronizado com o timer da sessão.
- Se `audio_url` for vazio e `tem_audio=false`, player roda em modo "apenas visual" (animação + timer silencioso).
- Seed inicial deixa `audio_url` vazio (admin sobe depois). UI já funciona em modo visual.

## Player guiado (componente `BreathingPlayer`)

- Tela cheia, fundo gradiente roxo (palette das telas).
- Círculo SVG que expande/contrai conforme `padrao_respiracao` (CSS `transform: scale` com `transition`).
- Texto central rotaciona entre "Inspire" / "Segure" / "Expire".
- Barra de progresso `currentTime / duracao`.
- Controles: pause/play, encerrar (→ check-out), volume (se `tem_audio`).
- Ao terminar duração, navega automaticamente para `/praticas/:slug/checkout`.

## Check-out emocional

- 5 botões grandes (Calmo, Energizado, Leve, Reflexivo, Igual) com ícones material symbols.
- Textarea opcional para "alguma percepção".
- "Concluir e Ver Resumo" → POST para edge function `submit-pratica-checkout` (passa `user_id` se houver sessão; anon caso contrário) → navega para tela concluída.
- "Pular por enquanto" → pula direto para concluída.

## CMS no admin

Nova rota `/admin/praticas` (protegida por `requiredRole="admin"`), incluída no `AdminLayout` e no sidebar admin:

- Lista de práticas (drag-drop para reordenar, toggle ativo/destaque).
- Editor de prática: todos os campos da tabela + uploader de áudio para Storage + preview do padrão de respiração.
- Gestão de grupos (CRUD simples).
- Gestão de atalhos (chips).
- Aba "Check-outs" — tabela read-only de respostas recentes para feedback qualitativo.

## Frontend — hooks e componentes

Novos hooks (React Query):
- `usePraticas()` — lista pública agrupada
- `usePratica(slug)` — detalhe
- `usePraticasAtalhos()` — chips
- `useAdminPraticas()` + mutations (CRUD)

Novos componentes em `src/components/praticas/`:
- `PraticasHero.tsx`, `EncontrarAgoraChips.tsx`, `PraticaCard.tsx`, `GrupoSection.tsx`
- `BreathingPlayer.tsx`, `BreathingCircle.tsx`
- `CheckoutEmocional.tsx`, `SessaoConcluida.tsx`
- `CienciaCallout.tsx`, `BuscarApoioCTA.tsx`
- Admin: `AdminPraticasList.tsx`, `AdminPraticaEditor.tsx`, `AdminGruposManager.tsx`

Páginas novas em `src/pages/praticas/`:
- `PraticasIndex.tsx`, `PraticaDetalhe.tsx`, `PraticaSessao.tsx`, `PraticaCheckout.tsx`, `PraticaConcluida.tsx`

Página admin: `src/pages/admin/PraticasAdmin.tsx`.

## Design

- Reaproveita o sistema de design do tenant atual (semantic tokens em `index.css`) — **não** hardcodear cores. Mapeio as cores roxas das HTMLs de referência para `--primary` / `--primary-container` já existentes.
- Tipografia: usa `font-headline` (Noto Serif via @fontsource já instalado) e `font-body` já configuradas. Se não estiverem, adiciono `@fontsource/noto-serif` e `@fontsource/plus-jakarta-sans` via `bun add` e registro em `tailwind.config.ts`.
- Ícones: `lucide-react` (já no projeto) — mapeio cada `material symbol` da referência para o lucide equivalente (`Wind`, `HeartPulse`, `Eye`, `Activity`, `Sparkles`, etc.).
- Animações: usa `animate-fade-in`, `animate-scale-in` já no `tailwind.config.ts`; círculo de respiração com transition CSS custom.

## Navegação

- Adiciono link "Práticas" no menu principal (Header/Navigation existentes) e no footer.
- Rotas duplicadas para tenant `medcos`: `/medcos/praticas`, `/medcos/praticas/:slug`, etc. (mesmo padrão usado no `App.tsx`).
- `ScrollToTop` automático ao navegar (já implementado globalmente).

## SEO

- Title: "Práticas para Reequilíbrio Emocional | Rede Bem-Estar" (<60 chars OK).
- Meta description otimizada; H1 único por página; JSON-LD `HowTo` por prática.
- Adicionar `/praticas` e cada `/praticas/:slug` ao `scripts/generate-sitemap.ts`.

## Detalhes técnicos

- Edge function `submit-pratica-checkout` (`verify_jwt = false`): valida com Zod, insere via service role, retorna `{ok:true}`.
- Bucket `praticas-audio` criado público no Storage (migração SQL).
- Sem `lovable-assets` para áudio do seed inicial (vazio) — admin faz upload posterior.

## Fora do escopo (perguntar antes se quiser incluir)

- Geração automática de áudio narrado via TTS.
- Tracking analítico granular (tempo de pausa, abandono).
- Versão mobile-only de app (PWA / instalação).
