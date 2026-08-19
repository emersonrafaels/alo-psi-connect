/**
 * Camada de persistência da jornada.
 * No protótipo usa sessionStorage; a interface permite trocar por Supabase depois
 * sem alterar UI, reducer ou motor de recomendação.
 */
import type { JourneyState } from "./journeyReducer";

const KEY = "rbe.jornada.session.v1";

export interface JourneySessionRepository {
  load(): JourneyState | null;
  save(state: JourneyState): void;
  clear(): void;
}

export const localSessionRepository: JourneySessionRepository = {
  load() {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as JourneyState) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* silencioso: protótipo não bloqueia a jornada por falha de storage */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};
