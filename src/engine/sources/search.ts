/**
 * Chave de busca de um nome (design B4): sem acentos, minúscula e sem espaços
 * nas pontas. "  BOLA de fôgo " e "Bola de Fogo" dão a mesma chave.
 */
export function searchKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}
