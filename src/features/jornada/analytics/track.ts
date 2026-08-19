import { TAXONOMY_VERSION } from "../config/emotion-taxonomy";
import type { JourneyEvent, JourneyEventProps } from "./events";

/**
 * Camada de instrumentação da jornada.
 * Nesta fase de protótipo apenas registra em memória/console (sem chamadas de rede).
 * A assinatura já está preparada para plugar um provider real depois.
 */
const buffer: { event: JourneyEvent; props: JourneyEventProps; at: string }[] = [];

export const track = (event: JourneyEvent, props: JourneyEventProps = {}) => {
  const payload = {
    event,
    props: { taxonomyVersion: TAXONOMY_VERSION, ...props },
    at: new Date().toISOString(),
  };
  buffer.push(payload);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[jornada]", payload.event, payload.props);
  }
};

export const getTrackedEvents = () => [...buffer];
