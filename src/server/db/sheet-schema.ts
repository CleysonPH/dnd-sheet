import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

/** Fichas de personagem (design C1). O documento fica inteiro em `data`. */
export const sheet = pgTable(
  "sheet",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Cópia de data.identity.name, para listar e ordenar sem ler o documento.
    name: text("name").notNull(),
    version: integer("version").notNull().default(1),
    data: jsonb("data").notNull(),
    // Código do link de compartilhamento; nulo sem link (design L1).
    shareToken: text("share_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("sheet_owner_id_idx").on(table.ownerId)],
);
