## Objetivo
Substituir a Home atual da Rede Bem-Estar (`/`) pelo novo design "The Human Editorial" do Stitch, replicando fielmente o conteúdo do mock e mantendo a Home antiga apenas para o tenant `medcos`.

## Estratégia (mesmo padrão usado na /sobre)

1. **Criar `src/components/home/HomeRedeBemEstar.tsx`** com o novo layout completo.
2. **Criar `src/components/home/HomeMedcos.tsx`** movendo o conteúdo atual de `Index.tsx`.
3. **Refatorar `src/pages/Index.tsx`** como roteador de tenant: renderiza `HomeRedeBemEstar` quando `tenant.slug !== 'medcos'`, senão `HomeMedcos`.
4. **Estilos escopados** em `src/index.css` sob a classe `.rbe-home-page` (mesmo padrão de `.rbe-about-page`), reutilizando os tokens RBE já existentes e adicionando novos do Material Design 3 do mock (`--rbe-primary-container`, `--rbe-secondary-container`, `--rbe-tertiary-fixed`, `--rbe-surface-container-lowest/low/high`, etc.) com variantes light/dark.
5. **Não alterar** `src/index.css` global nem `tailwind.config` — todos os tokens novos vivem dentro do escopo `.rbe-home-page`.

## Seções do novo layout (na ordem)

1. **Hero** — Badge "Cuidado Ativo" + headline "Cuidar da mente é cultivar o futuro." + foto da mulher profissional com glass card "Impacto Real" sobreposto + CTAs "Agendar Demonstração" / "Conhecer Mais".
2. **Desafios Diários** — 4 cards (Pressão Cronológica, Isolamento Social, Erosão Cognitiva, Invisibilidade) com ícones em círculos coloridos.
3. **Metodologia AME** — 3 colunas (Acolhimento/Mapeamento/Encaminhamento) com border-top colorida (roxo/menta/rosa) e mini-grid 2×2 de sub-features.
4. **Bem-estar é inteligência preventiva** — texto + mockup de celular Buddy + card de gráfico flutuante.
5. **Bento "Onde a tecnologia encontra o coração"** — Buddy bubble + cards Diário/Dashboards.
6. **Check-in Diário** — 4 cards (Energia, Foco, Sono, Conexão) com pills clicáveis (apenas visual no mock).
7. **Infográfico Rede Bem-Estar** — bloco intro + 4 colunas (Cuidado Individual, Ferramentas Aluno, Experiências Coletivas, Soluções para Instituições) com listas de check.
8. **Sub-seção Metodologia AME** — foto circular + step-by-step 1-2-3 + 4 cards roxos "Mais escuta / clareza / ação / Para todos".
9. **Profissionais em Destaque** (mantida) — reutiliza o fetch atual de `featuredProfessionals` e renderiza com `ProfessionalCard`, mas com wrapper estilizado no novo design (cards arredondados `rounded-[2rem]`, fundo `surface-container-lowest`).
10. **Buddy no WhatsApp** — split com mockup de chat + features (Easy Chats, Notificações, Privacidade).
11. **CTA Final** — Header + Footer existentes do projeto.

## Tokens novos (escopados em `.rbe-home-page`)

```css
.rbe-home-page {
  --rbe-primary: #420073;
  --rbe-primary-container: #5B218E;
  --rbe-on-primary: #ffffff;
  --rbe-secondary: #944076;
  --rbe-secondary-container: #fd98d4;
  --rbe-on-secondary-container: #7b2a5f;
  --rbe-tertiary-fixed: #b0edf3;
  --rbe-secondary-fixed: #ffd8eb;
  --rbe-primary-fixed: #f1dbff;
  --rbe-surface: #f9f9f9;
  --rbe-surface-container-lowest: #ffffff;
  --rbe-surface-container-low: #f3f3f3;
  --rbe-surface-container: #eeeeee;
  --rbe-surface-container-high: #e8e8e8;
  --rbe-on-surface: #1a1c1c;
  --rbe-on-surface-variant: #4c4451;
  --rbe-outline-variant: #cec3d3;
  --rbe-brand-purple: #5B218E;
  --rbe-brand-mint: #97D3D9;
  --rbe-brand-pink: #E281BB;
  font-family: 'Manrope', 'Inter', sans-serif;
}

.dark .rbe-home-page {
  --rbe-surface: #0F0A1A;
  --rbe-surface-container-lowest: #1a1228;
  --rbe-surface-container-low: #1E1733;
  --rbe-surface-container: #251c3d;
  --rbe-surface-container-high: #2d2347;
  --rbe-on-surface: #E2E8F0;
  --rbe-on-surface-variant: #B8AFC4;
  --rbe-outline-variant: #4c4451;
  --rbe-primary: #deb7ff;
  --rbe-primary-container: #5B218E;
  --rbe-secondary-container: #7b2a5f;
}
```

Utilitários: `.rbe-glass-card` (já existe da /sobre), `.rbe-organic-gradient` (linear `--rbe-primary` → `--rbe-primary-container` 135°).

## Tipografia

A fonte **Manrope** precisa ser adicionada ao `<link>` do Google Fonts em `index.html` (ao lado de Plus Jakarta Sans + Inter já presentes). Aplicada via `font-family` apenas no escopo `.rbe-home-page`.

## Mapeamento de ícones (Material Symbols → lucide-react)

- `favorite` → `Heart`
- `schedule` → `Clock`
- `groups` / `groups_3` → `Users`
- `psychology` → `Brain`
- `visibility_off` → `EyeOff`
- `smart_toy` → `Bot`
- `book` → `BookOpen`
- `self_improvement` → `Sparkles`
- `assignment_turned_in` → `ClipboardCheck`
- `analytics` / `insights` → `LineChart`
- `dashboard` → `LayoutDashboard`
- `description` → `FileText`
- `medical_services` → `Stethoscope`
- `calendar_month` → `CalendarDays`
- `report_problem` → `AlertTriangle`
- `account_balance` → `Building2`
- `bedtime` → `Moon`
- `person_search` → `UserSearch`
- `arrow_forward` → `ArrowRight`
- `trending_up` → `TrendingUp`
- `diversity_1` → `HeartHandshake`
- `smartphone` → `Smartphone`
- `check_circle` → `CheckCircle2`

## Imagens (geradas com IA via Lovable AI Gateway)

Vou gerar 2 imagens com `google/gemini-2.5-flash-image` e salvar em `src/assets/`:

1. **`home-rbe-hero.jpg`** — "Professional Brazilian woman, 30s, smiling warmly, soft natural lighting, modern bright office background, looking at camera, friendly and trustworthy expression, editorial photography style, soft purple/pink color tones in background, vertical 4:5 aspect" — usada no hero.
2. **`home-rbe-ame.jpg`** — "Diverse group of young Brazilian university students sitting in circle in a sunlit university campus garden, warm conversation, soft pastel colors, editorial documentary photography, natural lighting, hopeful mood, square aspect" — usada na sub-seção AME (foto circular).

Os mockups de celular/dashboard/chat WhatsApp são todos construídos com divs Tailwind (sem imagens externas), copiando a estrutura do `code-3.html`.

## Profissionais em Destaque (dados reais)

- Mantenho o `useState` + `useEffect` + `fetchFeaturedProfessionals` exatamente como está hoje.
- Renderizo dentro de uma seção nova chamada "Nossa Rede de Cuidado" entre o Infográfico (seção 8) e o Buddy WhatsApp (seção 10).
- Cards com fundo `--rbe-surface-container-lowest`, `rounded-[2rem]`, sombra suave, mostrando foto, nome, profissão, CRP/CRM e botão "Ver perfil" → `buildTenantPath(tenantSlug, '/profissionais/${id}')`.
- Estado de loading com 3 skeletons; estado vazio oculta a seção inteira.

## Navegação dos CTAs

- "Agendar Demonstração" / "Falar com Especialista" / CTA final → `/contato`
- "Conhecer Mais" → scroll suave para a seção Metodologia AME (`#metodologia-ame`)
- "Allow on WhatsApp" / "Buddy WhatsApp" → link `wa.me` usando `mem://brand/rede-bem-estar/contact-info` (vou ler a memória para pegar o número correto)
- Cards de profissional → página individual do profissional
- Reset de scroll ao montar (regra Core de memória)

## Responsividade & Dark Mode (incorporados desde o início)

- Hero: `text-4xl sm:text-5xl lg:text-7xl`, CTAs `w-full sm:w-auto`, foto com `aspect-[4/5]` mantido em todos os tamanhos.
- Grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (Desafios, Infográfico) e `lg:grid-cols-3` (AME).
- Bento: empilha verticalmente em mobile (`md:col-span-8` vira `col-span-1`).
- Mockups absolutos com `overflow-hidden` no container pai.
- `overflow-x-hidden` no root `.rbe-home-page` para conter os blobs decorativos.
- Todas as cores via tokens — zero hardcoded `bg-white` / `text-slate-*`.
- Padding seções: `py-16 sm:py-20 lg:py-24`, container `px-4 sm:px-6 lg:px-8`.

## O que NÃO muda

- `Header` e `Footer` continuam os mesmos (já são tenant-aware).
- Rotas, tenant context, hooks de auth, fetch de profissionais.
- Home do tenant `medcos` (extraída para `HomeMedcos.tsx` sem alterações de conteúdo).
- Página `/sobre` e qualquer outra página.

## Arquivos a serem criados

- `src/components/home/HomeRedeBemEstar.tsx` (novo, ~700 linhas)
- `src/components/home/HomeMedcos.tsx` (novo, conteúdo movido do Index.tsx atual)
- `src/assets/home-rbe-hero.jpg` (gerada via AI)
- `src/assets/home-rbe-ame.jpg` (gerada via AI)

## Arquivos a serem modificados

- `src/pages/Index.tsx` — vira roteador condicional por tenant (~30 linhas)
- `src/index.css` — adicionar bloco `.rbe-home-page` com tokens light/dark
- `index.html` — adicionar Manrope ao Google Fonts link

## Memória a salvar após implementação

- `mem://brand/rede-bem-estar/page-structures-and-messaging` — atualizar para refletir a nova narrativa da Home (Hero → Desafios → Metodologia AME → Inteligência Preventiva → Bento → Check-in → Infográfico → Profissionais → WhatsApp).
- Possível nova memória `mem://design/rede-bem-estar/material-design-tokens` documentando o sistema de tokens MD3 escopado.

## Validação final

- Build TypeScript limpo.
- Testar visualmente nas viewports: 360, 768, 1144, 1440.
- Testar dark mode em todas as seções.
- Verificar que `/medcos` (se rota tenant existir) continua mostrando a Home antiga.