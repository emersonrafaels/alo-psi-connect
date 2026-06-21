## Objetivo
Adicionar áudios de meditação públicos (livres de royalties / domínio público) às práticas, para que a sessão imersiva tenha uma trilha de voz/ambiente real enquanto não há áudios próprios gravados.

## Fontes
Usar arquivos públicos hospedados em CDNs confiáveis (sem necessidade de upload), com licenças permissivas:

- **Pixabay Music / Meditation** (licença Pixabay, uso livre) — trilhas calmas instrumentais
- **Internet Archive** — meditações guiadas em domínio público / Creative Commons
- **Free Music Archive (FMA)** — faixas ambient CC0/CC-BY

Exemplos candidatos (URLs diretas .mp3):
- Pixabay: "Meditation" ambient pad (~10 min, loopável)
- Archive.org: "Guided Meditation for Relaxation" (CC)
- FMA: Kevin MacLeod "Meditation Impromptu" (CC-BY)

Validarei as URLs antes de aplicar (HEAD request) e farei fallback para 2-3 opções caso uma falhe.

## Mudanças

### 1. Mapeamento por grupo de prática
Criar `src/data/praticasAudios.ts` com:
- Mapa `slug` → URL de áudio (voz guiada quando existir)
- Mapa `grupo_slug` → URL de som ambiente (fallback genérico)
- Default global para qualquer prática sem match

### 2. `PraticaSessao.tsx`
- Se `pratica.audio_url` (do banco) existir → continua usando ele (prioridade)
- Senão → usar URL do mapa por `slug`, depois por `grupo_id`, depois default
- O elemento `<audio>` sempre é renderizado quando há URL resolvida
- Toggle de voz (`Volume2/VolumeX`) passa a aparecer sempre que houver URL resolvida (não só quando `tem_audio` for true no banco)
- Som ambiente procedural (Web Audio drone) permanece como está, controlado pelo toggle `Music2/Music`

### 3. Atribuição
Adicionar pequena nota de créditos no rodapé do `PraticaDetalhe.tsx` (texto discreto: "Áudio: [fonte] — licença [x]") para cumprir CC-BY quando aplicável.

## Fora de escopo
- Não vou subir arquivos para Lovable Assets nem Supabase Storage (são URLs externas públicas)
- Não vou alterar o schema do banco nem o admin de práticas
- Não vou mudar a animação de respiração nem o som ambiente procedural

## Arquivos
- novo: `src/data/praticasAudios.ts`
- editar: `src/pages/praticas/PraticaSessao.tsx`
- editar: `src/pages/praticas/PraticaDetalhe.tsx` (créditos)
