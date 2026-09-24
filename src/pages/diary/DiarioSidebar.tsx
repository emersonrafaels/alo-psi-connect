
import { NavLink } from "react-router-dom";

import {
  BookHeart,
  History,
  Settings,
} from "lucide-react";

const navigationItems = [
  {
    label: "Diário Emocional",
    mobileLabel: "Diário",
    path: "/diario-emocional-v2",
    icon: BookHeart,
    end: true,
  },
  {
    label: "Histórico",
    mobileLabel: "Histórico",
    path: "/diario-emocional-v2/historico",
    icon: History,
    end: false,
  },
  {
    label: "Configurações",
    mobileLabel: "Configurações",
    path: "/diario-emocional-v2/configuracoes",
    icon: Settings,
    end: false,
  },
];

const DiarioSidebar = () => {
  return (
    <>
      {/* SIDEBAR DESKTOP */}

      <aside
        className="
          hidden w-[240px] shrink-0
          border-r border-slate-200
          bg-[#f8f9fc] px-4 py-6
          dark:border-slate-800
          dark:bg-[#111827]
          md:block
        "
      >
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
            Bem-estar
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#ebe7ff] text-[#173575] dark:bg-violet-500/20 dark:text-violet-200"
                      : "text-slate-600 hover:bg-white hover:text-[#173575] dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* NAVEGAÇÃO MOBILE */}

      <nav
        aria-label="Navegação do Diário Emocional"
        className="
          fixed inset-x-0 bottom-0 z-[60]
          border-t border-slate-200
          bg-white px-2 pt-2
          pb-[calc(env(safe-area-inset-bottom)+8px)]
          shadow-[0_-4px_20px_rgba(15,23,42,0.08)]
          dark:border-slate-800
          dark:bg-[#111827]
          md:hidden
        "
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium transition-colors ${
                    isActive
                      ? "bg-[#f1eeff] text-[#173575] dark:bg-violet-500/20 dark:text-violet-200"
                      : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="text-center leading-tight">
                  {item.mobileLabel}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default DiarioSidebar;