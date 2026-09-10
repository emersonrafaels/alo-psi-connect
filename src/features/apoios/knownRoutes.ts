/**
 * Rotas públicas conhecidas do app (base, sem prefixo de tenant).
 * Usado para desabilitar botões de apoios cujo destino ainda não existe,
 * evitando que o aluno caia em "página não encontrada".
 */
const KNOWN_ROUTES = [
  "/",
  "/sobre",
  "/blog",
  "/profissionais",
  "/agendar",
  "/agendamento",
  "/contato",
  "/trabalhe-conosco",
  "/politica-privacidade",
  "/termos-servico",
  "/radar-institucional",
  "/perfil",
  "/auth",
  "/buddy",
  "/buddy/me-conhecer",
  "/buddy/como-te-conhece",
  "/buddy/padroes",
  "/buddy/jornada",
  "/buddy/pontos-de-forca",
  "/buddy/privacidade",
  "/agendamentos",
  "/triagem",
  "/diario-emocional",
  "/diario-emocional/experiencia",
  "/diario-emocional/nova-entrada",
  "/diario-emocional/historico",
  "/diario-emocional/analises",
  "/diario-emocional/padrao",
  "/encontros",
  "/meus-encontros",
  "/escalas",
  "/minhas-emocoes",
  "/biblioteca-apoios",
  "/praticas",
  "/praticas/jornada",
];

/** Um destino é válido quando corresponde a uma rota conhecida (ignorando query/hash). */
export const isKnownRoute = (route?: string | null): boolean => {
  if (!route) return false;
  if (/^https?:\/\//i.test(route)) return true;
  const path = route.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return KNOWN_ROUTES.includes(path);
};
