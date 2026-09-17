import { Outlet } from "react-router-dom";

import Header from "@/components/ui/header";
import DiarioSidebar from "./DiarioSidebar";

const DiarioEmocionalLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Header />

      <div className="flex min-h-[calc(100vh-64px)]">
        <DiarioSidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DiarioEmocionalLayout;