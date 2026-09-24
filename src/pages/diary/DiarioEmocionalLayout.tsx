
import { Outlet } from "react-router-dom";

import Header from "@/components/ui/header";
import DiarioSidebar from "./DiarioSidebar";
import DiarioMobileHeader from "./DiarioMobileHeader";

const DiarioEmocionalLayout = () => {
  return (
<div
  className="
    diario-v2
    flex h-[100dvh] w-full min-w-0
    flex-col overflow-hidden
    bg-[#f5f7fb] dark:bg-[#0b1020]
    md:h-auto md:min-h-screen md:overflow-visible
  "
>
      {/* HEADER DESKTOP */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* HEADER MOBILE */}
      <div className="shrink-0 lg:hidden">
        <DiarioMobileHeader />
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex min-h-0 min-w-0 flex-1">

        <DiarioSidebar />

        {/* CONTEÚDO COM ROLAGEM */}
        <main
          className="
            min-h-0 min-w-0 flex-1
            overflow-x-hidden overflow-y-auto
            overscroll-contain
            pb-[calc(120px+env(safe-area-inset-bottom))]
            md:overflow-visible md:pb-0
          "
        >
          <Outlet />
        </main>

      </div>
      
    </div>
  );
};

export default DiarioEmocionalLayout;