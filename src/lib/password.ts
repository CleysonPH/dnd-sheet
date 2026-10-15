import { z } from "zod";

/** Regras de tamanho de senha, comuns ao servidor e aos formulários. */
export const passwordSchema = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres")
  .max(128, "A senha pode ter no máximo 128 caracteres");
