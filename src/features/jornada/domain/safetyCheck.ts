/**
 * SafetyCheck — camada separada, baseada exclusivamente em protocolo aprovado.
 *
 * Regras invioláveis:
 * - nenhuma emoção equivale a diagnóstico;
 * - intensidade alta, sozinha, NÃO representa risco;
 * - nenhum alerta institucional é gerado a partir da jornada;
 * - nenhuma regra clínica é inventada aqui.
 *
 * Enquanto a curadoria não fornecer o protocolo aprovado, o resultado é sempre
 * "sem ação automática" — apenas o acesso voluntário a apoio permanece visível.
 */
export interface SafetyCheckResult {
  /** Nunca deriva de intensidade: só de protocolo aprovado. */
  requiresProtocolAction: boolean;
  protocolId: string | null;
  reason: "no_approved_protocol";
}

export const SAFETY_PROTOCOL_VERSION = "rbe-safety-0.0.0-pending-protocol";

export const runSafetyCheck = (): SafetyCheckResult => ({
  requiresProtocolAction: false,
  protocolId: null,
  reason: "no_approved_protocol",
});
