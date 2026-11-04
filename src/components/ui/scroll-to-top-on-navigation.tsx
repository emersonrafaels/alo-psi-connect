import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Scrolls to the top whenever a portal institucional, encontro or blog post page is opened,
 * refreshes data on entering the portal or "Meu espaço" (and on returning to the tab),
 * and flags the body so portal-only styles (card hover effects) apply.
 */
export const ScrollToTopOnPortalNavigation = () => {
  const { pathname } = useLocation();
  const qc = useQueryClient();
  const isPortal = pathname.includes("portal-institucional");
  const isHub = isPortal || pathname.includes("/meu-espaco");
  const scrollTop = isPortal || /\/encontros\/[^/]+/.test(pathname) || /\/blog\/[^/]+/.test(pathname) || pathname.includes("/meu-espaco");

  useEffect(() => {
    if (scrollTop) window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, scrollTop]);

  useEffect(() => {
    if (!isHub) return;
    const refresh = () => qc.invalidateQueries({ refetchType: "active" });
    refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [pathname, isHub, qc]);

  useEffect(() => {
    document.body.classList.toggle("institution-portal", isPortal);
    return () => document.body.classList.remove("institution-portal");
  }, [isPortal]);

  return null;
};

export default ScrollToTopOnPortalNavigation;
