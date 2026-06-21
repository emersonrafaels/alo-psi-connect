import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PraticaGrupo {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

export interface Pratica {
  id: string;
  slug: string;
  grupo_id: string | null;
  titulo: string;
  subtitulo: string | null;
  descricao_curta: string | null;
  corpo_ciencia: string | null;
  icone: string | null;
  duracao_min_default: number;
  duracoes_disponiveis: number[];
  ideal_para: string | null;
  categoria_badge: string | null;
  audio_url: string | null;
  tem_audio: boolean;
  padrao_respiracao: { inspirar: number; segurar: number; expirar: number };
  ordem: number;
  ativo: boolean;
  destaque: boolean;
}

export interface PraticaAtalho {
  id: string;
  texto: string;
  pratica_slug: string | null;
  ordem: number;
  ativo: boolean;
}

export const usePraticas = () => {
  return useQuery({
    queryKey: ["praticas-public"],
    queryFn: async () => {
      const [gruposRes, praticasRes] = await Promise.all([
        supabase.from("praticas_grupos").select("*").eq("ativo", true).order("ordem"),
        supabase.from("praticas").select("*").eq("ativo", true).order("ordem"),
      ]);
      if (gruposRes.error) throw gruposRes.error;
      if (praticasRes.error) throw praticasRes.error;
      return {
        grupos: (gruposRes.data ?? []) as PraticaGrupo[],
        praticas: (praticasRes.data ?? []) as unknown as Pratica[],
      };
    },
  });
};

export const usePratica = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["pratica", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("praticas")
        .select("*")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Pratica | null;
    },
  });
};

export const usePraticasAtalhos = () => {
  return useQuery({
    queryKey: ["praticas-atalhos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("praticas_atalhos")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as PraticaAtalho[];
    },
  });
};
