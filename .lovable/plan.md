
# 🎨 Substituir página `/sobre` pelo novo design Stitch

Vamos reconstruir a página **`/sobre`** da **Rede Bem-Estar (tenant `alopsi`)** seguindo fielmente o mock do Stitch enviado (`code-2.html` + `DESIGN-2.md` "Serenity & Wisdom"), mantendo o Header e Footer atuais do projeto e preservando o layout antigo apenas para o tenant **MEDCOS**.

---

## 1. Estratégia de tenant

- `src/pages/About.tsx` continua como roteador interno:
  - Se `tenant.slug === 'medcos'` → renderiza o componente atual (mantido como `AboutMedcos`).
  - Caso contrário (RBE / outros) → renderiza o novo `AboutRedeBemEstar` baseado no Stitch.
- Header e Footer globais do projeto são mantidos (não substituiremos pelo nav/footer do mock).

---

## 2. Tokens de design (sem quebrar o resto do site)

O design Stitch usa cores e raios próprios. Para evitar conflito com o tema global, vou:

- Adicionar **utilitários escopados** em `src/index.css` dentro de `@layer utilities`, prefixados com `rbe-about-*`:
  - `--rbe-primary: #6F2DBD`
  - `--rbe-secondary: #6DE0D6` (turquesa)
  - `--rbe-bg: #FAFAFF`
  - `--rbe-lilac-light: #F0E7FF`
  - `--rbe-turquoise-light: #E0F9F7`
  - `--rbe-surface-variant: #F4F3F9`
- Classes utilitárias:
  - `.rbe-organic-shape-1` / `.rbe-organic-shape-2` → border-radius "blob"
  - `.rbe-glass-card` → glassmorphism com 12px backdrop-blur
  - `.rbe-smile-curve` → o sorriso decorativo do mock
  - `.rbe-rounded-huge` → `border-radius: 2.5rem`
- Fonte **Plus Jakarta Sans** carregada via `<link>` em `index.html` (Google Fonts) e aplicada apenas dentro do escopo da nova página com a classe wrapper `.rbe-about-page` (`font-family: 'Plus Jakarta Sans', sans-serif`).

Tudo escopado dentro de `.rbe-about-page` → zero impacto em outras páginas.

---

## 3. Estrutura do novo componente

Criar `src/components/about/AboutRedeBemEstar.tsx` com as seções, na ordem do mock:

1. **Hero** — Badge "INOVAÇÃO EM SAÚDE MENTAL" pulsante, headline em roxo profundo, dois CTAs (`Conhecer plataforma` → `/profissionais`, `Falar com a equipe` → `/contato`) e composição à direita com **4 cards flutuantes**: Buddy, Check-in Diário (3 emojis), Dashboard "Engajamento Institucional 87.4%" e mini Diário Emocional. Blobs orgânicos turquesa + lilás de fundo.
2. **Por que existimos** — Card branco grande com ícone `volunteer_activism` e citação "Cuidar melhor também é decidir melhor."
3. **Missão / Visão / Propósito** — Grid 3 colunas. O card **Propósito** em roxo sólido com blob branco translúcido.
4. **O que fazemos** — 4 cards em grid 2x2: Buddy, Diário Emocional, Escalas e Dados, Atendimento Especializado. Cada um com ícone + chip de categoria.
5. **Para quem fazemos** — 3 cards com banner topo colorido: Estudantes (turquesa), Professores (lilás), Instituições (roxo claro).
6. **Como atuamos** — Timeline horizontal com 3 passos numerados (Acolher / Mapear / Encaminhar), círculos roxos com badge turquesa e linha pontilhada conectora.
7. **Cuidado que conversa com a realidade universitária** — Bloco lilás com imagem (foto de estudantes) + 3 bullets check à direita. Imagem placeholder (Unsplash) que poderá ser trocada depois.
8. **Nossos princípios** — Grid de 6 cards pequenos: Ética, Privacidade, Escuta, Clareza, Cuidado Contínuo, Diversidade.
9. **O que nos diferencia** — Seção full-bleed em roxo com 4 cards glass: IA Especializada, Resposta em Tempo Real, Protocolos Validados, Integração Nativa.
10. **Impacto que queremos gerar** — 4 big numbers turquesa: +90%, +85%, 100%, 24/7.
11. **CTA final** — Bloco roxo grande com botão turquesa "Solicitar demonstração gratuita" → navega para `/contato`.

> A faixa "Instituições que confiam na nossa rede" do mock será **omitida** por enquanto (já existe seção de parceiros na home; podemos plugar depois se desejado).

---

## 4. Ícones

O mock usa **Material Symbols Outlined**. Para não adicionar uma nova fonte de ícones, vou mapear todos para **lucide-react** (já no projeto):

| Mock | Lucide |
|---|---|
| `volunteer_activism` | `HeartHandshake` |
| `track_changes` | `Target` |
| `visibility` | `Eye` |
| `auto_awesome` | `Sparkles` |
| `smart_toy` | `Bot` |
| `auto_stories` | `BookOpen` |
| `insights` | `BarChart3` |
| `psychology` | `Brain` |
| `school` | `GraduationCap` |
| `person_celebrate` | `UserCheck` |
| `account_balance` | `Building2` |
| `favorite` / `map` / `trending_up` | `Heart` / `Map` / `TrendingUp` |
| `done_all` | `CheckCheck` |
| `verified_user` / `lock` / `hearing` / `lightbulb` / `vital_signs` / `diversity_3` | `ShieldCheck` / `Lock` / `Ear` / `Lightbulb` / `Activity` / `Users` |
| `bolt` / `clinical_notes` / `integration_instructions` | `Zap` / `ClipboardList` / `Workflow` |
| `query_stats` | `LineChart` |
| `play_circle` | `PlayCircle` |

---

## 5. Navegação dos CTAs

- "Conhecer plataforma" → `/profissionais`
- "Falar com a equipe" → `/contato`
- "Solicitar demonstração gratuita" → `/contato`
- Todos usam `useNavigate()` + `window.scrollTo(0,0)` (regra do projeto: scroll reset em navegação interna).

---

## 6. Imagem da seção "Cuidado que conversa…"

Para o mock, vou usar **Unsplash** como placeholder fiel ao briefing (grupo diverso de estudantes universitários brasileiros, ar livre):
`https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80`

→ Você pode trocar depois enviando o asset definitivo para `src/assets/about-students.jpg`.

---

## 7. Responsividade

- Mobile-first conforme DESIGN-2.md (margens 20px, single-column).
- Hero: composição de cards flutuantes vira **stack vertical** abaixo de `lg`.
- Seções "O que fazemos" / "Para quem" / "Diferencial" / "Impacto" colapsam para 1 coluna em mobile, 2 em md, e voltam para o grid do mock em lg.
- Timeline "Como atuamos" vira vertical em mobile (sem a linha pontilhada).

---

## 8. Conteúdo (texto)

Vou usar **exatamente os textos do mock** do Stitch (headlines, descrições, frases dos princípios e métricas). Como esses textos já refletem a narrativa da RBE ("acolhimento", "cuidado", "estudantes/professores/instituições"), não há conflito com a regra de terminologia atual ("cuidado" / "acompanhamento"). Único ajuste: garantir uso de "cuidado" (não "cuidado mental").

---

## 9. Arquivos que vão ser criados/modificados

**Criados:**
- `src/components/about/AboutRedeBemEstar.tsx` — nova página (todas as seções acima).
- `src/components/about/AboutMedcos.tsx` — extração 1:1 do conteúdo MEDCOS atual.

**Modificados:**
- `src/pages/About.tsx` — vira um *router* curto: lê `tenant.slug`, decide qual sub-componente renderizar, e mantém o `<Header />` + `<Footer />` como hoje.
- `src/index.css` — adiciona o bloco `.rbe-about-page` com tokens (`--rbe-*`) e classes utilitárias (`rbe-organic-shape-1/2`, `rbe-glass-card`, `rbe-smile-curve`, `rbe-rounded-huge`).
- `index.html` — adiciona `<link>` do Google Fonts para `Plus Jakarta Sans` (não-bloqueante, com `display=swap`).

**Não tocados:** `Index.tsx` (home), Header, Footer, demais rotas.

---

## 10. QA antes de entregar

- Conferir `/sobre` no tenant **alopsi (RBE)** → vê o novo design.
- Conferir `/medcos/sobre` → continua com o layout antigo do MEDCOS.
- Verificar que nenhuma outra página (Home, Profissionais, Blog) mudou de tipografia ou cores (escopo confinado em `.rbe-about-page`).
- Testar responsividade em 375px / 768px / 1280px.
- Verificar dark mode: como a página é desenhada em fundo claro com cores específicas, vou **forçar o tema claro** apenas dentro de `.rbe-about-page` (fundo `--rbe-bg`, texto `--rbe-on-bg`), independente do toggle global — mantendo legibilidade. Posso fazer uma variante dark futuramente caso queira.

---

## ▶️ Próximos passos depois desta aprovação

Após sua aprovação, eu:
1. Crio os 2 componentes + atualizo `About.tsx`.
2. Insiro tokens/utilitários em `index.css` e fonte em `index.html`.
3. Faço screenshot do resultado para você conferir.

Quando estiver bom, na próxima rodada partimos para a **Home (`/`)** reaproveitando os mesmos tokens `--rbe-*`.
