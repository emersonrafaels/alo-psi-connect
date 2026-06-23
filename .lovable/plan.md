
## Objetivo

Alinhar a área de Práticas à especificação visual: manter apenas as 6 práticas das imagens, num único grupo, e tratar os atalhos da home de Práticas como tags (não botões).

---

## 1. Catálogo de práticas (banco de dados)

Nova migration que reorganiza `praticas_grupos`, `praticas` e `praticas_atalhos`.

### 1.1 Grupos
- Manter um único grupo ativo: `regular-desacelerar-agora` — "Regular e Desacelerar agora", descrição: "Práticas breves para regular o sistema nervoso e desacelerar quando precisar."
- Desativar (`ativo = false`) os grupos antigos `regular-agora`, `soltar-o-corpo`, `acolher-desacelerar` (mantém histórico, evita quebrar checkouts).

### 1.2 Práticas — desativar todas existentes (`UPDATE praticas SET ativo = false`) e inserir/upsert as 6 novas, todas no grupo único, na ordem das imagens:

| # | slug | título | duração default | durações | padrão respiração (default) | ícone | badge |
|---|------|--------|-----------------|----------|----------------------------|-------|-------|
| 1 | `suspiro-de-alivio` | Suspiro de alívio | 1 | [1,2,3] | inspira 4 + inspira curta 1 + expira 8 (ciclo especial) | Wind | ALÍVIO |
| 2 | `pausa-tres-minutos` | Pausa de três minutos | 3 | [3] | n/a (3 etapas de 1 min: perceber → respirar → ampliar) | Clock | PRESENÇA |
| 3 | `grounding-54321` | Grounding 5-4-3-2-1 | 5 | [3,5] (+ "sem limite") | n/a (sensorial: ver/tocar/ouvir/cheirar/saborear) | Eye | ANCORAGEM |
| 4 | `respiracao-lenta-ritmada` | Respiração lenta e ritmada | 5 | [3,5,10] | 4 inspira / 0 / 6 expira (preset 4×6; alternativas 3×5, 5×5) | Waves | EQUILÍBRIO |
| 5 | `respiracao-quatro-etapas` | Respiração em quatro etapas | 4 ciclos | quantidade [4,8,12] | 4-4-4-4 (alternativa 3-3-3-3) — quatro fases com pausa | Square | FOCO |
| 6 | `respiracao-478` | Respiração 4-7-8 | 2 ciclos | [2,4] | 4 inspira / 7 segura / 8 expira | Moon | SONO |

Cada linha grava em `padrao_respiracao` (JSONB) o ritmo recomendado; campos extras de configuração específicos (orientação voz/animação, posição, olhos, momento, sequência, participação) ficam serializados num novo JSONB `opcoes_extra` adicionado à tabela `praticas` (ALTER TABLE ADD COLUMN IF NOT EXISTS), permitindo que a UI da página de detalhe mostre apenas as opções aplicáveis a cada prática sem novas tabelas.

### 1.3 Atalhos
- Limpar `praticas_atalhos` e reinserir mapeando para os novos slugs:
  - "Quero me acalmar agora" → `respiracao-lenta-ritmada`
  - "Estou muito ansioso" → `respiracao-478`
  - "Preciso de uma pausa" → `pausa-tres-minutos`
  - "Estou sobrecarregado" → `grounding-54321`
  - "Quero focar antes de algo importante" → `respiracao-quatro-etapas`
  - "Preciso de alívio imediato" → `suspiro-de-alivio`

---

## 2. Página principal de Práticas (`src/pages/praticas/PraticasIndex.tsx`)

- Converter o bloco "Comece por aqui / Sinta a pausa. Respire." em **tags visuais** em vez de botões interativos retangulares:
  - Renderizar cada atalho como `<Badge>` ou `<span>` com estilo de tag (pill outline, ícone `#` opcional, cores suaves), agrupados em flex-wrap centralizado.
  - Remover o `onClick` que navega para a prática (tags são informativas — refletem necessidades atendidas). Se quisermos manter navegação, mantemos como `<Link>` mas com aparência de tag (sem hover de botão).
  - Manter o título "Comece por aqui / Sinta a pausa. Respire."
- Como agora só há um grupo, a seção de grupos exibirá um único título "Regular e Desacelerar agora" com as 6 práticas em grid 2 colunas (sem mudança estrutural).

Decisão a confirmar: **tags devem continuar clicáveis** (levam à prática) ou são puramente informativas? Default proposto: clicáveis, mas com visual de tag (não de botão).

---

## 3. Página de detalhe (`PraticaDetalhe.tsx`)

Cada prática mostra apenas as configurações relevantes (lidas de `opcoes_extra`):

- **Suspiro de alívio**: duração (1/2/3 min), ritmo (natural/lento), orientação (voz+animação / só voz / só animação).
- **Pausa de três minutos**: orientação (completa/essencial/sons de transição), posição (sentado/em pé/deitado), olhos (abertos/fechados/decidir durante).
- **Grounding 5-4-3-2-1**: duração (3/5/sem limite), sequência (clássica/adaptada), participação (observar/marcar itens/escrever palavras).
- **Respiração lenta e ritmada**: duração (3/5/10), ritmo (3×5 / 4×6 / 5×5), guia visual (círculo/onda/sem animação).
- **Respiração em quatro etapas**: ritmo (3×3×3×3 / 4×4×4×4), quantidade de ciclos (4/8/12), orientação (quadrado+voz / só quadrado / só voz).
- **Respiração 4-7-8**: ciclos (2/4), momento (pausa durante o dia / antes de dormir), orientação (voz+contagem / só voz / só animação).

Todas as práticas devem **abrir com o padrão recomendado já selecionado**, conforme a regra de produto da imagem.

Trilha sonora, tema visual, legendas e movimento reduzido permanecem como preferências secundárias recolhidas (collapsible) — alinhado à imagem "Elementos comuns / Preferências secundárias".

---

## 4. Página de sessão (`PraticaSessao.tsx`)

- O `BreathingCircle` atual cobre as 4 práticas respiratórias (1, 4, 5, 6). Para `respiracao-quatro-etapas` precisamos suportar fase extra "pausar" após expirar — adicionar etapa "segurar_expirado" no preset (já temos `segurar`, vamos reusar como pós-expiração quando o slug pedir).
- **Pausa de três minutos** e **Grounding 5-4-3-2-1** precisam de telas próprias, não circle:
  - `PausaTresMinutosSessao`: timer de 3 min dividido em 3 blocos de 1 min (perceber / respirar / ampliar) com transição automática.
  - `GroundingSessao`: 5 telas sequenciais (5 ver → 4 tocar → 3 ouvir → 2 cheirar → 1 saborear) com botão "Próximo"; aceita modo "observar/marcar itens/escrever palavras".
- `PraticaSessao.tsx` decide qual componente renderizar com base no slug.
- **Suspiro de alívio**: ciclo especial (inspira longa + inspira curta + expira longa). Adicionar suporte no `BreathingCircle` para uma 2ª fase de inspiração curta opcional, controlada por flag no preset.

---

## 5. Aspectos técnicos

- Nova migration:
  ```text
  ALTER TABLE praticas ADD COLUMN IF NOT EXISTS opcoes_extra JSONB DEFAULT '{}';
  UPDATE praticas SET ativo = false;
  UPDATE praticas_grupos SET ativo = false;
  -- insert grupo único + 6 práticas com upsert por slug
  DELETE FROM praticas_atalhos; INSERT ... (6 novos)
  ```
- Componentes novos: `src/components/praticas/PausaTresMinutosSessao.tsx`, `src/components/praticas/GroundingSessao.tsx`, hook `usePraticaOpcoesExtra` que lê `opcoes_extra`.
- Ajuste de tipos: `Pratica` em `usePraticas.tsx` ganha `opcoes_extra?: Record<string, unknown>`.
- `PraticasIndex`: refatorar bloco de atalhos para tags (`Badge` shadcn com `variant="outline"`, classes `text-xs px-3 py-1 rounded-full`).

---

## 6. Fora deste escopo

- Conteúdo definitivo de `corpo_ciencia` para cada prática (será preenchido com textos de placeholder fiéis ao "Objetivo" das imagens, podemos refinar depois).
- Geração de áudio guiado por voz para cada prática (mantemos trilhas Kevin MacLeod já configuradas).
- Painel admin para editar `opcoes_extra` por prática (próxima iteração).

---

## Perguntas para confirmar antes de implementar

1. Os atalhos em forma de tag devem continuar **clicáveis** levando à prática, ou são **puramente informativos**?
2. Posso desativar as 8 práticas antigas (mantendo no banco) ou prefere deleção definitiva?
3. Para "Pausa de três minutos" e "Grounding 5-4-3-2-1" — confirma que devem ter telas dedicadas (sem `BreathingCircle`)?
