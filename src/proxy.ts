import { NextResponse, type NextRequest } from "next/server";

import { getAuth } from "@/server/auth";

const LOGIN = "/login";
const CHANGE_PASSWORD = "/trocar-senha";
/** Abrem sem sessão: o login e a recuperação de senha (design P6). */
const PUBLIC_PATHS = ["/login", "/esqueci-senha", "/redefinir-senha"];

/** Ficha compartilhada por link: aberta com ou sem sessão (design L3). */
function isSharedPath(pathname: string): boolean {
  return pathname.startsWith("/compartilhada/");
}

/**
 * Redirecionamentos de conveniência (design A4) e 404 em /admin para quem não
 * é admin. A garantia de acesso está nos guards de cada página e action; isto
 * só evita mostrar telas que vão falhar.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getAuth().api.getSession({ headers: request.headers });
  const user = session && !session.user.banned ? session.user : null;

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (!user) {
    return PUBLIC_PATHS.includes(pathname) || isSharedPath(pathname)
      ? NextResponse.next()
      : redirectTo(LOGIN);
  }
  if (user.mustChangePassword) {
    return pathname === CHANGE_PASSWORD
      ? NextResponse.next()
      : redirectTo(CHANGE_PASSWORD);
  }
  // Ficha compartilhada: abre também com sessão, sem redirecionar (design L3).
  if (isSharedPath(pathname)) return NextResponse.next();
  if (PUBLIC_PATHS.includes(pathname) || pathname === CHANGE_PASSWORD) {
    return redirectTo("/");
  }
  if (pathname.startsWith("/admin") && user.role !== "admin") {
    // Rota inexistente: responde 404 sem revelar que a área de contas existe.
    return NextResponse.rewrite(new URL("/_nao-encontrado", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tudo, exceto a API (o Better Auth trata a própria autenticação), os
    // arquivos internos do Next e arquivos estáticos com extensão.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
