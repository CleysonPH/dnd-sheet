"use client";

import { createContext, useContext } from "react";

/**
 * Se quem abre a ficha é admin (design B7): mostra "Enviar ao compêndio" nas
 * fontes. A ficha compartilhada não fornece o contexto, então fica false.
 */
const SheetAdminContext = createContext(false);

export const SheetAdminProvider = SheetAdminContext;

export function useIsSheetAdmin(): boolean {
  return useContext(SheetAdminContext);
}
