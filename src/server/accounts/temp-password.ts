// Sem caracteres que se confundem ao ditar ou ler: 0/O, 1/l/I.
export const TEMP_PASSWORD_ALPHABET =
  "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const TEMP_PASSWORD_LENGTH = 16;

/** Senha provisória aleatória (design A6). Usa rejeição para não enviesar o sorteio. */
export function generateTempPassword(length = TEMP_PASSWORD_LENGTH): string {
  const alphabet = TEMP_PASSWORD_ALPHABET;
  const limit = 256 - (256 % alphabet.length);
  let password = "";
  while (password.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length * 2));
    for (const byte of bytes) {
      if (byte < limit && password.length < length) {
        password += alphabet[byte % alphabet.length];
      }
    }
  }
  return password;
}
