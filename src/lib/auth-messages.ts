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

/** Mensagens das specs para a recuperação de senha (design P6). */
export const RESET_MESSAGES = {
  requested:
    "Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
  tooManyAttempts: "Muitas tentativas. Tente de novo em alguns instantes.",
  invalidLink: "Link inválido ou expirado.",
  done: "Senha redefinida. Entre com a nova senha.",
  unexpected: "Não foi possível concluir. Tente de novo.",
} as const;

type ResetError = { status?: number; code?: string } | null | undefined;

/** Erro do pedido de link. Fora o excesso de pedidos, a resposta é a padrão. */
export function requestResetErrorMessage(error: ResetError): string {
  if (error?.status === 429) return RESET_MESSAGES.tooManyAttempts;
  return RESET_MESSAGES.unexpected;
}

/** Erro da redefinição pelo link. */
export function resetPasswordErrorMessage(error: ResetError): string {
  if (error?.status === 429) return RESET_MESSAGES.tooManyAttempts;
  if (error?.code === "INVALID_TOKEN") return RESET_MESSAGES.invalidLink;
  return RESET_MESSAGES.unexpected;
}
