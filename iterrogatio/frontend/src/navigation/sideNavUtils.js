import { matchPath } from "react-router-dom";

/** Indica se a rota atual corresponde ao item do menu (preparado para rotas aninhadas via `matchPath`). */
export function isSideNavPathActive(pathname, itemPath) {
  return !!matchPath({ path: itemPath, end: true }, pathname);
}
