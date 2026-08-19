/**
 * Protocolos curatoriais das práticas — tempos reais em segundos.
 * Não usar tempos acelerados de demonstração.
 */
import type { PracticeProtocol } from "../domain/types";

export const PROTOCOLS_VERSION = "rbe-practice-protocols-1.0.0";

export const PRACTICE_PROTOCOLS: PracticeProtocol[] = [
  {
    id: "protocolo_suspiro_alivio",
    version: "1.0.0",
    playerType: "breathing",
    silentModeAvailable: true,
    cyclesPerRun: 8,
    phases: [
      { key: "inhale", label: "Inspire", seconds: 3, hint: "Inspiração suave pelo nariz." },
      { key: "inhale", label: "Complete", seconds: 1, hint: "Segunda inspiração curta pelo nariz." },
      { key: "exhale", label: "Expire", seconds: 6, hint: "Solte o ar lentamente pela boca." },
    ],
  },
  {
    id: "protocolo_respiracao_lenta",
    version: "1.0.0",
    playerType: "breathing",
    silentModeAvailable: true,
    cyclesPerRun: 6,
    phases: [
      { key: "inhale", label: "Inspire", seconds: 4, hint: "Inspire suavemente, sem forçar." },
      { key: "exhale", label: "Expire", seconds: 6, hint: "Expire um pouco mais devagar." },
    ],
  },
  {
    id: "protocolo_respiracao_quatro_etapas",
    version: "1.0.0",
    playerType: "breathing",
    silentModeAvailable: true,
    cyclesPerRun: 6,
    phases: [
      { key: "inhale", label: "Inspire", seconds: 4, hint: "Inspire com suavidade." },
      { key: "hold", label: "Pausa breve", seconds: 2, hint: "Apenas uma pausa confortável." },
      { key: "exhale", label: "Expire", seconds: 4, hint: "Solte o ar devagar." },
      { key: "hold_after_exhale", label: "Pausa breve", seconds: 2, hint: "Aguarde naturalmente." },
    ],
  },
  {
    id: "protocolo_coerencia_cardiaca",
    version: "1.0.0",
    playerType: "breathing",
    silentModeAvailable: true,
    cyclesPerRun: 6,
    phases: [
      { key: "inhale", label: "Inspire", seconds: 5, hint: "Acompanhe a expansão do círculo." },
      { key: "exhale", label: "Expire", seconds: 5, hint: "Acompanhe o círculo diminuindo." },
    ],
  },
  {
    id: "protocolo_grounding_54321",
    version: "1.0.0",
    playerType: "grounding",
    silentModeAvailable: true,
    phases: [],
    steps: [
      { title: "Observe", instruction: "Encontre 5 coisas que você consegue ver.", seconds: 45 },
      { title: "Toque", instruction: "Perceba 4 sensações de contato.", seconds: 40 },
      { title: "Escute", instruction: "Identifique 3 sons ao redor.", seconds: 35 },
      { title: "Continue", instruction: "Perceba 2 cheiros e 1 sabor ou sensação interna.", seconds: 40 },
    ],
  },
  {
    id: "protocolo_pausa_3_minutos",
    version: "1.0.0",
    playerType: "awareness",
    silentModeAvailable: true,
    phases: [],
    steps: [
      { title: "Chegue", instruction: "Perceba como você está agora.", seconds: 45 },
      { title: "Respire", instruction: "Acompanhe algumas respirações naturais.", seconds: 45 },
      { title: "Amplie", instruction: "Perceba o corpo e o ambiente ao redor.", seconds: 45 },
      { title: "Retome", instruction: "Escolha como deseja continuar.", seconds: 45 },
    ],
  },
  {
    id: "protocolo_nomear_acolher",
    version: "1.0.0",
    playerType: "awareness",
    silentModeAvailable: true,
    phases: [],
    steps: [
      { title: "Nomeie", instruction: "Reconheça a palavra que você escolheu.", seconds: 60 },
      { title: "Perceba", instruction: "Observe onde isso aparece no corpo ou nos pensamentos.", seconds: 60 },
      { title: "Acolha", instruction: "Permita que a emoção esteja presente por alguns instantes.", seconds: 60 },
      { title: "Cuide", instruction: "Pergunte o que você precisa oferecer a si agora.", seconds: 60 },
    ],
  },
  {
    id: "protocolo_saborear_momento",
    version: "1.0.0",
    playerType: "awareness",
    silentModeAvailable: true,
    phases: [],
    steps: [
      { title: "Perceba", instruction: "Observe o que está fazendo bem agora.", seconds: 30 },
      { title: "Permaneça", instruction: "Fique alguns segundos com essa experiência.", seconds: 30 },
      { title: "Guarde", instruction: "Escolha uma imagem, sensação ou frase.", seconds: 30 },
      { title: "Registre", instruction: "Decida se deseja salvar esse momento.", seconds: 30 },
    ],
  },
];

export const PROTOCOL_INDEX: Record<string, PracticeProtocol> = Object.fromEntries(
  PRACTICE_PROTOCOLS.map((p) => [p.id, p])
);

export const getProtocol = (id: string | null | undefined): PracticeProtocol | null =>
  (id && PROTOCOL_INDEX[id]) || null;
