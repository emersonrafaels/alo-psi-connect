import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top whenever a portal institucional page is opened
 * and flags the body so portal-only styles (card hover effects) apply.
 */
export const ScrollToTopOnPortalNavigation = () => {
  const { pathname } = useLocation();
  const isPortal = pathname.includes("portal-institucional");

  useEffect(() => {
    if (isPortal) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname, isPortal]);

  useEffect(() => {
    document.body.classList.toggle("institution-portal", isPortal);
    return () => document.body.classList.remove("institution-portal");
  }, [isPortal]);

  return null;
};

export default ScrollToTopOnPortalNavigation;
