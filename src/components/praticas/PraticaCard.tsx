import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { IconePratica } from "./IconePratica";
import type { Pratica } from "@/hooks/usePraticas";

interface Props {
  pratica: Pratica;
  basePath: string;
}

export const PraticaCard = ({ pratica, basePath }: Props) => {
  return (
    <Link
      to={`${basePath}/praticas/${pratica.slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div
        className="h-full rounded-2xl p-[1px] transition-all group-hover:shadow-[var(--shadow-glow)]"
        style={{ backgroundImage: "var(--gradient-border)" }}
      >
        <Card
          className="h-full p-6 transition-all group-hover:-translate-y-0.5 border-0 rounded-[15px] backdrop-blur-xl"
          style={{ backgroundImage: "var(--gradient-card)" }}
        >
          {pratica.categoria_badge && (
            <Badge variant="secondary" className="mb-3 uppercase tracking-wider text-[10px] bg-gradient-to-r from-primary/10 to-accent/10 text-primary border border-primary/15">
              {pratica.categoria_badge}
            </Badge>
          )}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary shrink-0 shadow-sm">
              <IconePratica name={pratica.icone} className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xl text-foreground mb-1 group-hover:text-primary transition-colors">
                {pratica.titulo}
              </h3>
              {pratica.descricao_curta && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {pratica.descricao_curta}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {pratica.duracao_min_default} min
                </span>
                {pratica.ideal_para && <span>· Ideal para: {pratica.ideal_para}</span>}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </Card>
      </div>
    </Link>
  );
};
