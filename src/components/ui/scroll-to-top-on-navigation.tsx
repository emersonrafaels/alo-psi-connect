import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top whenever a portal institucional page is opened
 * (direct navigation, header links, tab changes that alter the route).
 */
export const ScrollToTopOnPortalNavigation = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.includes("portal-institucional")) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTopOnPortalNavigation;
