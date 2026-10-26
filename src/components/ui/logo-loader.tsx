import { cn } from "@/lib/utils";

const LOGO_ICON =
  "https://alopsi-website.s3.us-east-1.amazonaws.com/rede_bem_estar/imagens/logos/logo_redebemestar_icon_1.png";

interface LogoLoaderProps {
  /** Texto opcional exibido abaixo do logo (ex.: "Carregando portal institucional..."). */
  label?: string;
  /** Ajusta dimensões/posicionamento (ex.: "min-h-[40vh]", "py-12"). */
  className?: string;
}

/**
 * Loader padrão da plataforma: logo da Rede Bem-Estar girando no centro da tela.
 * Usado em qualquer carregamento de página inteira ou de seção principal.
 */
export function LogoLoader({ label, className }: LogoLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-10 text-center",
        className
      )}
    >
      <div className="logo-loader-orb">
        <img
          src={LOGO_ICON}
          alt=""
          aria-hidden="true"
          className="logo-loader-mark"
          draggable={false}
        />
      </div>
      {label ? (
        <p className="text-sm text-muted-foreground">{label}</p>
      ) : (
        <span className="sr-only">Carregando…</span>
      )}
    </div>
  );
}
