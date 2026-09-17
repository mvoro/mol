import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeRoleFavorites, readRoleFavorites, saveRoleFavorites, ROLE_FAVORITES_KEY, ROLE_FAVORITES_EVENT } from "./role-data.js";

export function useRoleFavorites() {
  const [favorites, setState] = useState(readRoleFavorites);
  const current = useRef(favorites);
  const setFavorites = useCallback(value => {
    const next = saveRoleFavorites(typeof value === "function" ? value(current.current) : value);
    current.current = next;
    setState(next);
  }, []);
  useEffect(() => {
    const update = event => {
      if (event.type === "storage" && event.key && event.key !== ROLE_FAVORITES_KEY) return;
      const next = event.type === ROLE_FAVORITES_EVENT ? normalizeRoleFavorites(event.detail) : readRoleFavorites();
      current.current = next;
      setState(next);
    };
    window.addEventListener(ROLE_FAVORITES_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(ROLE_FAVORITES_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return [favorites, setFavorites];
}
