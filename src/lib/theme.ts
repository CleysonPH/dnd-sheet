/** Chave do localStorage com a preferência de tema do aparelho (design V2). */
export const THEME_STORAGE_KEY = "dnd-sheet:theme";

/**
 * Aplicado no <head> antes da primeira pintura (design V2). Sem preferência
 * guardada, fica o escuro, que é o padrão do CSS.
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
