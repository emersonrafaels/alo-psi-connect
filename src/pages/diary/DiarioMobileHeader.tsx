
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

const DiarioMobileHeader = () => {
  return (
    <header
      className="
        sticky top-0 z-40
        w-full min-w-0
        border-b border-slate-200
        bg-white
        transition-colors duration-200

        dark:border-slate-800
        dark:bg-[#111827]

        lg:hidden
      "
    >
      <div
        className="
          flex h-16 w-full min-w-0
          items-center gap-2
          px-3 sm:px-4
        "
      >
        {/* Botão voltar */}

        <Link
          to="/"
          aria-label="Voltar ao site"
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            bg-slate-100
            text-[#173575]
            transition-colors
            hover:bg-slate-200

            dark:bg-slate-800
            dark:text-slate-100
            dark:hover:bg-slate-700
          "
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Identificação do Diário */}

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
              bg-[#eee9ff]

              dark:bg-violet-500/20
            "
          >
            <Heart
              className="
                h-5 w-5
                text-[#7667c9]
                dark:text-violet-300
              "
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate text-[10px]
                font-medium
                text-slate-400

                dark:text-slate-400
              "
            >
              REDE BEM-ESTAR
            </p>

            <p
              className="
                truncate text-xs
                font-bold
                text-[#173575]

                dark:text-slate-100

                sm:text-sm
              "
            >
              Diário Emocional
            </p>
          </div>
        </div>

        {/* Botão de alternância de tema */}

        <div className="ml-auto flex shrink-0 items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default DiarioMobileHeader;