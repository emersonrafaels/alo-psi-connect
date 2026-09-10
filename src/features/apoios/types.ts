export type SupportOrigin = "platform" | "institution";

export interface SupportCatalogRow {
  id: string;
  slug: string;
  title: string;
  origin_type: string;
  category: string;
  format: string;
  access_type: string;
  icon: string;
  description: string;
  details: string | null;
  how_to: string | null;
  when_to: string | null;
  provider: string | null;
  cta_label: string | null;
  cta_route: string | null;
  featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface InstitutionSupportRow {
  id: string;
  institution_id: string;
  catalog_id: string | null;
  title: string;
  category: string;
  format: string;
  access_type: string;
  icon: string;
  description: string;
  details: string | null;
  how_to: string | null;
  when_to: string | null;
  provider: string | null;
  contact_channel: string | null;
  contact_value: string | null;
  notes: string | null;
  featured: boolean;
  is_published: boolean;
  sort_order: number;
}

/** Item normalizado exibido na Biblioteca de Apoios. */
export interface SupportItem {
  key: string;
  title: string;
  origin: SupportOrigin;
  originLabel: string;
  category: string;
  format: string;
  accessType: string;
  icon: string;
  description: string;
  details?: string | null;
  howTo?: string | null;
  whenTo?: string | null;
  provider?: string | null;
  contactChannel?: string | null;
  contactValue?: string | null;
  ctaLabel?: string | null;
  ctaRoute?: string | null;
  featured: boolean;
}

export const SUPPORT_CATEGORIES = [
  "Saúde emocional",
  "Vida acadêmica",
  "Apoio material",
  "Acessibilidade",
  "Carreira",
  "Parentalidade",
  "Pertencimento",
  "Práticas e conteúdos",
] as const;

export const SUPPORT_FORMATS = [
  "Atendimento individual",
  "Grupo",
  "Mentoria",
  "Orientação",
  "Prática",
  "Trilha",
  "Conteúdo",
] as const;

export const SUPPORT_ACCESS_TYPES = [
  "Acesso imediato",
  "Acesso direto",
  "Agendamento",
  "Consultar instituição",
] as const;

export const catalogToItem = (row: SupportCatalogRow): SupportItem => ({
  key: `catalog:${row.id}`,
  title: row.title,
  origin: row.origin_type === "institution" ? "institution" : "platform",
  originLabel: row.origin_type === "institution" ? "Instituição" : "Plataforma",
  category: row.category,
  format: row.format,
  accessType: row.access_type,
  icon: row.icon,
  description: row.description,
  details: row.details,
  howTo: row.how_to,
  whenTo: row.when_to,
  provider: row.provider,
  ctaLabel: row.cta_label,
  ctaRoute: row.cta_route,
  featured: row.featured,
});

export const institutionToItem = (
  row: InstitutionSupportRow,
  institutionName?: string
): SupportItem => ({
  key: `inst:${row.id}`,
  title: row.title,
  origin: "institution",
  originLabel: institutionName || "Minha instituição",
  category: row.category,
  format: row.format,
  accessType: row.access_type,
  icon: row.icon,
  description: row.description,
  details: row.details,
  howTo: row.how_to,
  whenTo: row.when_to,
  provider: row.provider,
  contactChannel: row.contact_channel,
  contactValue: row.contact_value,
  ctaLabel: row.contact_value ? "Ver contato" : null,
  ctaRoute: null,
  featured: row.featured,
});
