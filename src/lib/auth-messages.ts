/** Mensagens das specs para os erros de login do Better Auth. */
export const LOGIN_MESSAGES = {
  invalidCredentials: "E-mail ou senha inválidos",
  deactivated: "Conta desativada. Fale com o administrador.",
  tooManyAttempts:
    "Muitas tentativas de login. Aguarde um minuto e tente de novo.",
  unexpected: "Não foi possível entrar. Tente de novo.",
} as const;

type LoginError = { status?: number; code?: string } | null | undefined;

export function loginErrorMessage(error: LoginError): string {
  if (!error) return LOGIN_MESSAGES.unexpected;
  if (error.status === 429) return LOGIN_MESSAGES.tooManyAttempts;
  if (error.code === "BANNED_USER") return LOGIN_MESSAGES.deactivated;
  if (error.code === "INVALID_EMAIL_OR_PASSWORD" || error.status === 401) {
    return LOGIN_MESSAGES.invalidCredentials;
  }
  return LOGIN_MESSAGES.unexpected;
}
