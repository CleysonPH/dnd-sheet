import { createAuthClient } from "better-auth/react";

/** Client do Better Auth para o navegador: só login e logout passam por aqui (design A3). */
export const authClient = createAuthClient();
