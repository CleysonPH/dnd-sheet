import { getAuth } from "@/server/auth";

// A instância é criada na primeira requisição, não no import (o build não tem .env).
function handler(request: Request) {
  return getAuth().handler(request);
}

export { handler as GET, handler as POST };
