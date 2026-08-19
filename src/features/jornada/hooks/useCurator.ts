import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CURATOR } from "../config/practices";

const FALLBACK_PHOTO =
  "https://alopsi-website.s3.amazonaws.com/imagens/fotosPerfil/profile-pictures/anne.jpg";

/**
 * Busca a foto da curadora no cadastro de profissionais da plataforma.
 * Se não encontrar, usa a foto conhecida do perfil como fallback.
 */
export const useCurator = () => {
  const { data } = useQuery({
    queryKey: ["jornada", "curator", CURATOR.name],
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profissionais")
        .select("display_name, foto_perfil_url")
        .ilike("display_name", "%Kaufmann%")
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });

  return {
    ...CURATOR,
    displayName: data?.display_name ?? CURATOR.name,
    photoUrl: data?.foto_perfil_url ?? FALLBACK_PHOTO,
    initials: (data?.display_name ?? CURATOR.name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  };
};
