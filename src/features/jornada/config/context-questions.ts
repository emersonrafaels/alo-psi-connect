/** Perguntas contextuais curatoriais por família emocional. */
import type { ContextQuestion } from "../domain/types";

export const CONTEXT_QUESTIONS_VERSION = "rbe-context-questions-1.0.0";

export const CONTEXT_QUESTIONS: ContextQuestion[] = [
  {
    id: "ctx_medo",
    familyId: "medo",
    question: "O que parece mais forte agora?",
    options: [
      { id: "mente_acelerada", label: "Minha mente não para" },
      { id: "tensao_corpo", label: "Meu corpo está tenso" },
      { id: "preocupacao_futuro", label: "Estou preocupado com o que pode acontecer" },
      { id: "dificuldade_foco", label: "Não consigo focar" },
      { id: "nao_sei", label: "Não sei explicar" },
    ],
  },
  {
    id: "ctx_raiva",
    familyId: "raiva",
    question: "O que você mais precisa neste momento?",
    options: [
      { id: "reduzir_intensidade", label: "Baixar a intensidade" },
      { id: "criar_pausa", label: "Criar uma pausa antes de agir" },
      { id: "entender", label: "Entender melhor o que aconteceu" },
      { id: "voltar_presente", label: "Voltar ao presente" },
    ],
  },
  {
    id: "ctx_tristeza",
    familyId: "tristeza",
    question: "O que seria mais útil agora?",
    options: [
      { id: "acolher", label: "Acolher o que estou sentindo" },
      { id: "voltar_presente", label: "Voltar ao presente" },
      { id: "parar", label: "Parar por alguns minutos" },
      { id: "nao_sei", label: "Ainda não sei" },
    ],
  },
  {
    id: "ctx_alegria",
    familyId: "alegria",
    question: "O que você gostaria de fazer com este momento?",
    options: [
      { id: "perceber", label: "Perceber melhor o que está fazendo bem" },
      { id: "guardar", label: "Guardar este momento" },
      { id: "agradecer", label: "Reconhecer uma pessoa ou experiência" },
      { id: "energia", label: "Aproveitar esta energia com presença" },
    ],
  },
  {
    id: "ctx_nojo",
    familyId: "nojo",
    question: "O que mais se aproxima do que você precisa?",
    options: [
      { id: "corpo", label: "Diminuir o desconforto no corpo" },
      { id: "distancia", label: "Criar um pouco de distância" },
      { id: "acolher", label: "Entender e acolher o que sinto" },
      { id: "presente", label: "Voltar ao presente" },
    ],
  },
  {
    id: "ctx_surpresa",
    familyId: "surpresa",
    question: "Como essa surpresa está aparecendo?",
    options: [
      { id: "desorientacao", label: "Estou desorientado ou confuso" },
      { id: "ativacao", label: "Estou muito ativado" },
      { id: "curiosidade", label: "Estou curioso ou interessado" },
      { id: "positivo", label: "Quero guardar algo positivo" },
    ],
  },
];

export const getContextQuestion = (familyId: string | null | undefined) =>
  CONTEXT_QUESTIONS.find((q) => q.familyId === familyId) ?? null;

export const getContextOptionLabel = (
  familyId: string | null | undefined,
  optionId: string | null | undefined
) => getContextQuestion(familyId)?.options.find((o) => o.id === optionId)?.label ?? null;
