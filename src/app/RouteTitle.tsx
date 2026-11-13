import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageTitleFor } from "./pageTitles";

/**
 * Gives every route its own document title. Rendered once, before <Routes>, so a page that sets a
 * more specific title (for example a shared STEM image's own title) with useDocumentTitle wins.
 */
export default function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pageTitleFor(pathname);
  }, [pathname]);
  return null;
}
