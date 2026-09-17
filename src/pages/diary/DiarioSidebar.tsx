import { NavLink } from "react-router-dom";
import {
  BookHeart,
  History,
  Settings,
} from "lucide-react";

const DiarioSidebar = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `
      flex
      items-center
      gap-3
      rounded-xl
      px-3
      py-3
      text-sm
      font-medium
      transition-all
      ${
        isActive
          ? "bg-[#ebe7ff] text-[#173575]"
          : "text-slate-600 hover:bg-white hover:text-[#173575]"
      }
    `;

  return (
    <aside className="w-[240px] shrink-0 border-r border-slate-200 bg-[#f8f9fc] px-4 py-6">
      <div className="mb-6 px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Bem-estar
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink
          to="/diario-emocional-v2"
          end
          className={linkClass}
        >
          <BookHeart className="h-4 w-4" />
          Diário Emocional
        </NavLink>

        <NavLink
          to="/diario-emocional-v2/historico"
          className={linkClass}
        >
          <History className="h-4 w-4" />
          Histórico
        </NavLink>

        <NavLink
          to="/diario-emocional-v2/configuracoes"
          className={linkClass}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </NavLink>
      </nav>
    </aside>
  );
};

export default DiarioSidebar;