import { useEffect } from "react";

/**
 * Sets document.title while the calling component is shown. Pass null or undefined to leave the
 * current title alone (for example while a page's data is still loading).
 */
export function useDocumentTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
