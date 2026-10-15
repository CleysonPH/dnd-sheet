import { createAuthClient } from "better-auth/react";

/**
 * Client do Better Auth para o navegador: só login, logout e a recuperação de
 * senha passam por aqui (design A3 e P6).
 */
export const authClient = createAuthClient();
