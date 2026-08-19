/** Textos curatoriais de apoio para cada família emocional na Roda. */
export const FAMILY_COPY: Record<string, string> = {
  raiva:
    "A raiva costuma aparecer quando algo importante foi atravessado. O nível 1 não é a escolha final: as palavras do nível 2 ajudam a nomear com mais precisão.",
  medo:
    "O medo antecipa risco e prepara o corpo. Escolher a palavra mais próxima ajuda a saber se o cuidado é para o corpo ou para os pensamentos.",
  tristeza:
    "A tristeza pede tempo e acolhimento. As palavras do nível 2 mostram o que está pesando mais neste momento.",
  alegria:
    "A alegria também merece atenção. Nomear o tipo de alegria ajuda a prolongar e registrar o que está fazendo bem.",
  nojo:
    "O nojo sinaliza rejeição ou desconforto com algo. Nomear a palavra certa ajuda a criar a distância necessária.",
  surpresa:
    "A surpresa desorganiza por um instante. Escolher a palavra do nível 2 mostra se ela veio como susto ou como abertura.",
};

export const getFamilyCopy = (familyId?: string | null) =>
  (familyId && FAMILY_COPY[familyId]) ||
  "O clique no nível 1 abre as palavras do nível 2 para você nomear com mais precisão.";
