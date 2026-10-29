// Shape of one aggregated Radar de Permanência snapshot (per institution and semester).
// Only collective distributions — never individual answers.
export type Dir = 'risk' | 'protective';
export interface Item { dom: string; dir: Dir; lab: string[]; b: number[]; bu?: Record<string, number[]>; q?: string; t?: string }
export interface ExpGroup { label: string; period: string; items: Item[] }
export type Mult = Record<string, Record<string, number>>;
export interface PermUnit { k: string; nome: string; ini: string; n: number; est: number }
export interface PermModel {
  instrument: string;
  units: PermUnit[];
  tilt: Record<string, Record<string, number>>;
  items: Record<string, Item>;
  exp: Record<string, ExpGroup>;
  hidden: Record<string, number[]>;
  ctx: Record<string, { w: number; c: number; t: number; a: number; night: number }>;
  shift: Record<string, number>;
  stage: Record<string, number[]>;
  thr: Record<string, number>; thrm: Mult;
  recov: Record<string, number>;
  needs: Record<string, number>; needm: Mult;
  evs: Record<string, number>; evm: Mult; evAny: Record<string, number>;
  contact: Record<string, number>; contm: Mult;
  disc: Record<string, number>;
  first: Record<string, number>; firstm: Mult;
  wel: Record<string, number>; welm: Mult;
  tim: Record<string, number>;
  fmt: Record<string, number>; fmtm: Mult;
  cou: Record<string, number[]>;
}

const L5 = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre'];
const AG = ['De forma alguma', 'Pouco', 'Em parte', 'Bastante', 'Muito'];
const FREQ = ['Nunca', 'Uma vez', 'Algumas vezes', 'Frequentemente', 'Quase todos os dias'];

/** Demonstration snapshot (reference design, 2026.2). Used to seed demo institutions. */
export const DEMO_MODEL: PermModel = {
  instrument: 'v. 27/07/2026 · 77 perguntas · 11 temas',
  units: [
    { k: 'CT', nome: 'Contagem', ini: 'CT', n: 498, est: 1180 },
    { k: 'IT', nome: 'Itajubá', ini: 'IT', n: 362, est: 820 },
    { k: 'MC', nome: 'Montes Claros', ini: 'MC', n: 352, est: 806 },
  ],
  tilt: {
    perm: { CT: 0.5, IT: 0, MC: -0.4 }, mat: { CT: 0.45, IT: 0, MC: -0.3 }, inst: { CT: 0.35, IT: 0, MC: -0.35 },
    pert: { CT: 0.3, IT: 0.1, MC: -0.35 }, curso: { CT: 0.1, IT: 0, MC: -0.15 }, acad: { CT: 0.35, IT: 0, MC: -0.2 },
    clima: { CT: 0.2, IT: 0, MC: -0.15 }, ev: { CT: 0.3, IT: 0, MC: -0.2 },
  },
  items: {
    remat: { dom: 'perm', dir: 'protective', lab: ['Muito improvável', 'Improvável', 'Não sei', 'Provável', 'Muito provável'], b: [3, 5, 14, 30, 48], q: 'Qual é a probabilidade de você se rematricular no próximo semestre?' },
    tranc: { dom: 'perm', dir: 'risk', lab: FREQ, b: [64, 17, 12, 5, 2], q: 'Você tem considerado trancar temporariamente sua matrícula?' },
    aband: { dom: 'perm', dir: 'risk', lab: FREQ, b: [78, 11, 7, 3, 1], q: 'Você tem considerado abandonar o curso sem previsão de retorno?' },
    mudar: { dom: 'perm', dir: 'risk', lab: FREQ, b: [66, 15, 12, 5, 2], q: 'Você tem considerado mudar de curso ou área?' },
    concl: { dom: 'perm', dir: 'protective', lab: ['Nenhuma', 'Pouca', 'Alguma', 'Bastante', 'Muita'], b: [2, 6, 19, 37, 36] },
    escolha: { dom: 'perm', dir: 'risk', lab: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Quase sempre'], b: [34, 23, 22, 14, 7] },
    altern: { dom: 'perm', dir: 'protective', lab: ['Não acredito', 'Acredito pouco', 'Não sei', 'Acredito bastante', 'Acredito muito'], b: [7, 14, 36, 28, 15] },
    food: { dom: 'mat', dir: 'risk', lab: ['Nunca', 'Raramente', 'Algumas vezes', 'Muitas vezes', 'Quase sempre'], b: [58, 18, 14, 7, 3], t: 'Faltou alimentação adequada' },
    transport: { dom: 'mat', dir: 'risk', lab: ['Não dificultou', 'Dificultou pouco', 'Às vezes', 'Dificultou bastante', 'Dificultou muito'], b: [36, 20, 20, 15, 9], t: 'Transporte dificultou a participação' },
    housing: { dom: 'mat', dir: 'risk', lab: ['Nenhuma', 'Pouca', 'Alguma', 'Bastante', 'Muita'], b: [61, 15, 12, 8, 4], t: 'Moradia trouxe instabilidade' },
    digital: { dom: 'mat', dir: 'risk', lab: L5, b: [57, 20, 13, 7, 3], t: 'Faltou internet ou equipamento' },
    costs: { dom: 'mat', dir: 'risk', lab: L5, b: [44, 21, 19, 11, 5], t: 'Gastos essenciais impediram materiais' },
    finAtt: { dom: 'mat', dir: 'risk', lab: L5, b: [22, 18, 23, 22, 15], t: 'Preocupação financeira tira a atenção' },
    evSup: { dom: 'ev', dir: 'protective', lab: ['Nenhum apoio', 'Pouco apoio', 'Algum apoio', 'Apoio suficiente', 'Muito apoio'], b: [17, 28, 27, 20, 8] },
    know: { dom: 'inst', dir: 'protective', lab: ['Não conheço', 'Conheço pouco', 'Conheço alguns', 'Conheço bem', 'Conheço muito bem'], b: [11, 27, 34, 20, 8], t: 'Conhece os serviços de apoio' },
    ease: { dom: 'inst', dir: 'protective', lab: ['Muito difícil', 'Difícil', 'Mais ou menos', 'Fácil', 'Muito fácil'], b: [6, 17, 41, 27, 9], t: 'Acha fácil descobrir como acessar' },
    comfort: { dom: 'inst', dir: 'protective', lab: AG, b: [9, 21, 33, 25, 12], t: 'Sente-se confortável para pedir ajuda' },
    integ: { dom: 'inst', dir: 'protective', lab: ['Não', 'Pouco', 'Em parte', 'Bastante', 'Muito'], b: [12, 26, 37, 19, 6], t: 'Setores entendem a situação de forma integrada' },
    clear: { dom: 'inst', dir: 'protective', lab: ['Não recebi', 'Pouco claro', 'Parcialmente claro', 'Claro', 'Muito claro'], b: [8, 15, 29, 33, 15], t: 'Recebeu próximo passo claro (quem procurou)' },
    respect: { dom: 'clima', dir: 'risk', lab: ['Nunca', 'Uma vez', 'Algumas vezes', 'Frequentemente', 'Muito frequentemente'], b: [68, 15, 11, 4, 2] },
    safety: { dom: 'clima', dir: 'protective', lab: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], b: [2, 5, 18, 40, 35] },
    whom: { dom: 'clima', dir: 'protective', lab: ['Não sei', 'Sei pouco', 'Tenho alguma ideia', 'Sei bem', 'Sei exatamente'], b: [21, 24, 22, 23, 10] },
  },
  exp: {
    pert: { label: 'Pertencimento', period: 'Semestre atual', items: [
      { dom: 'pert', t: 'Sente que faz parte da comunidade do curso ou unidade', q: 'Você sente que faz parte da comunidade do seu curso ou campus?', dir: 'protective', lab: AG, b: [8, 19, 36, 26, 11] },
      { dom: 'pert', t: 'Tem colegas com quem pode contar', q: 'Você possui colegas com quem pode contar quando encontra uma dificuldade?', dir: 'protective', lab: ['Ninguém', 'Quase ninguém', 'Algumas pessoas', 'Boas conexões', 'Rede forte'], b: [5, 13, 38, 30, 14] },
      { dom: 'pert', t: 'Sente-se respeitado pelos professores', q: 'Você se sente respeitado pelos professores com quem convive?', dir: 'protective', lab: AG, b: [3, 8, 25, 40, 24] },
      { dom: 'pert', t: 'Sente-se acolhido pelas equipes e setores', q: 'Você se sente acolhido pelas equipes e setores da instituição?', dir: 'protective', lab: AG, b: [6, 15, 33, 32, 14] },
      { dom: 'pert', t: 'Não evita participar por medo de não se encaixar', q: 'Você evita participar por sentir que não se encaixa ou não será bem recebido?', dir: 'risk', lab: L5, b: [33, 25, 22, 13, 7] },
    ] },
    curso: { label: 'Curso e futuro', period: 'Semestre atual', items: [
      { dom: 'curso', t: 'Identifica-se com a área do curso', q: 'Você se identifica com o conteúdo e a área do seu curso?', dir: 'protective', lab: AG, b: [3, 7, 22, 38, 30] },
      { dom: 'curso', t: 'Curso corresponde às expectativas do ingresso', q: 'Até que ponto as atividades e os conteúdos do curso correspondem às expectativas que você tinha quando ingressou?', dir: 'protective', lab: ['Não correspondem', 'Correspondem pouco', 'Correspondem em parte', 'Correspondem bastante', 'Correspondem totalmente'], b: [5, 14, 39, 31, 11] },
      { dom: 'curso', t: 'Vê conexão com a vida real e profissional', q: 'Você consegue perceber como o que aprende no curso se conecta com situações profissionais, sociais ou da vida real?', dir: 'protective', lab: L5, b: [3, 10, 30, 36, 21] },
      { dom: 'curso', t: 'Tem clareza sobre caminhos profissionais', q: 'Você possui clareza suficiente sobre caminhos profissionais relacionados ao curso?', dir: 'protective', lab: ['Nenhuma clareza', 'Pouca', 'Alguma', 'Bastante', 'Muita'], b: [8, 22, 35, 24, 11] },
      { dom: 'curso', t: 'Tem informação para decidir a trajetória', q: 'Você sente que possui informações suficientes para tomar decisões sobre sua trajetória dentro do curso?', dir: 'protective', lab: ['Nenhuma informação', 'Pouca informação', 'Alguma informação', 'Informação suficiente', 'Informação muito clara'], b: [7, 20, 36, 28, 9] },
      { dom: 'curso', t: 'Confia que consegue recuperar uma dificuldade', q: 'Você se sente capaz de recuperar uma dificuldade acadêmica antes que ela se acumule?', dir: 'protective', lab: L5, b: [5, 15, 35, 31, 14] },
    ] },
    acad: { label: 'Vida acadêmica', period: 'Últimos 30 dias', items: [
      { dom: 'acad', t: 'Consegue acompanhar atividades e avaliações', q: 'Você conseguiu acompanhar o volume de atividades e avaliações?', dir: 'protective', lab: L5, b: [4, 12, 31, 36, 17] },
      { dom: 'acad', t: 'Demandas não ultrapassam tempo e energia', q: 'As demandas acadêmicas ultrapassaram o tempo e a energia que você tinha disponíveis?', dir: 'risk', lab: L5, b: [8, 17, 32, 27, 16] },
      { dom: 'acad', t: 'Entende o que é esperado nas disciplinas', q: 'Você compreende com clareza o que é esperado de você nas disciplinas, atividades e avaliações?', dir: 'protective', lab: L5, b: [3, 10, 27, 40, 20] },
      { dom: 'acad', t: 'Consegue acessar apoio acadêmico quando não entende', q: 'Quando não compreende um conteúdo ou atividade, você consegue acessar algum tipo de apoio acadêmico?', dir: 'protective', lab: L5, b: [9, 18, 32, 28, 13] },
      { dom: 'acad', t: 'Sem queda importante de desempenho', q: 'Você percebeu queda importante no seu desempenho ou na entrega de atividades?', dir: 'risk', lab: ['Nenhuma', 'Pequena', 'Alguma', 'Importante', 'Muito importante'], b: [31, 28, 24, 12, 5] },
    ] },
  },
  hidden: { CT: [18, 9, 20, 46, 7], IT: [22, 5, 16, 50, 7], MC: [25, 3, 14, 51, 7] },
  ctx: { CT: { w: 38, c: 36, t: 47, a: 18, night: 48 }, IT: { w: 27, c: 33, t: 36, a: 12, night: 36 }, MC: { w: 25, c: 32, t: 34, a: 10, night: 35 } },
  shift: { 'Manhã': 26, 'Tarde': 12, 'Integral': 15, 'Varia muito': 6 },
  stage: { all: [38, 41, 21], CT: [36, 42, 22], IT: [38, 41, 21], MC: [41, 40, 19] },
  thr: { 'Dificuldade financeira': 34, 'Trabalho e horários': 29, 'Dúvida sobre curso ou carreira': 19, 'Sofrimento emocional': 18, 'Dificuldade acadêmica': 17, 'Responsabilidades de cuidado': 12, 'Falta de pertencimento': 9, 'Nenhum no momento': 31 },
  thrm: { CT: { 'Dificuldade financeira': 1.15, 'Trabalho e horários': 1.25, 'Responsabilidades de cuidado': 1.1, 'Nenhum no momento': 0.85 }, IT: { 'Dúvida sobre curso ou carreira': 1.15 }, MC: { 'Dificuldade financeira': 0.9, 'Trabalho e horários': 0.8, 'Falta de pertencimento': 0.85, 'Nenhum no momento': 1.15 } },
  recov: { CT: 68, IT: 72, MC: 76 },
  needs: { 'Transporte': 31, 'Materiais acadêmicos': 22, 'Alimentação': 19, 'Internet ou equipamento': 14, 'Moradia': 9, 'Apoio para responsabilidades de cuidado': 8, 'Nenhum no momento': 38 },
  needm: { CT: { 'Transporte': 1.25, 'Apoio para responsabilidades de cuidado': 1.2, 'Nenhum no momento': 0.85 }, IT: { 'Internet ou equipamento': 1.15 }, MC: { 'Transporte': 0.8, 'Nenhum no momento': 1.15 } },
  evs: { 'Perda ou redução de renda': 21, 'Adoecimento de familiar': 15, 'Adoecimento pessoal': 12, 'Separação ou conflito familiar': 9, 'Mudança ou instabilidade de moradia': 8, 'Luto': 7, 'Nova responsabilidade de cuidado': 6, 'Gravidez ou nascimento de filho': 2 },
  evm: { CT: { 'Perda ou redução de renda': 1.2, 'Nova responsabilidade de cuidado': 1.2 }, IT: {}, MC: { 'Perda ou redução de renda': 0.85 } },
  evAny: { CT: 53, IT: 47, MC: 42 },
  contact: { 'Conteúdos e práticas': 46, 'Orientação acadêmica': 31, 'Acolhimento de bem-estar': 27, 'Assistência estudantil': 22, 'Atividade em grupo': 18, 'Não desejo contato': 24 },
  contm: { CT: { 'Assistência estudantil': 1.25, 'Atividade em grupo': 0.85 }, IT: {}, MC: { 'Atividade em grupo': 1.2 } },
  disc: { CT: 10, IT: 9, MC: 7 },
  first: { 'Apoio financeiro e material': 24, 'Apoio emocional e bem-estar': 17, 'Apoio acadêmico': 15, 'Carreira e futuro profissional': 13, 'Comunicação e acesso aos serviços': 12, 'Integração e pertencimento': 9, 'Convivência, respeito e segurança': 6, 'Acessibilidade e inclusão': 4 },
  firstm: { CT: { 'Apoio financeiro e material': 1.2, 'Integração e pertencimento': 0.85 }, IT: { 'Carreira e futuro profissional': 1.15 }, MC: { 'Apoio financeiro e material': 0.85, 'Apoio emocional e bem-estar': 1.1 } },
  wel: { 'Apresentação clara dos serviços disponíveis': 41, 'Apoio específico para estudantes trabalhadores': 33, 'Maior proximidade com professores': 29, 'Mentoria de estudantes veteranos': 26, 'Grupos e atividades de convivência': 22, 'Programa de recepção e ambientação': 21 },
  welm: { CT: { 'Apoio específico para estudantes trabalhadores': 1.25 }, IT: {}, MC: { 'Apoio específico para estudantes trabalhadores': 0.8, 'Grupos e atividades de convivência': 1.15 } },
  tim: { 'Logo no ingresso': 21, 'Canais disponíveis o tempo todo': 21, 'Antes das avaliações': 19, 'Quando aparecem sinais de dificuldade': 17, 'No início de cada semestre': 14, 'Quando o estudante pede': 8 },
  fmt: { 'Conteúdos curtos na plataforma': 44, 'Atendimento presencial individual': 38, 'Chat ou canal de mensagens': 33, 'Encontro online ao vivo': 21, 'Atividade presencial em grupo': 19, 'Trilhas autoguiadas': 18 },
  fmtm: { CT: { 'Atendimento presencial individual': 0.85, 'Chat ou canal de mensagens': 1.15 }, IT: {}, MC: { 'Atividade presencial em grupo': 1.2 } },
  cou: { CT: [16, 30, 43, 11], IT: [19, 31, 41, 9], MC: [20, 33, 38, 9] },
};
