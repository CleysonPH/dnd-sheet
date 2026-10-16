import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

/**
 * Entradas do compêndio (design B1): cada uma é uma fonte inteira em `data`,
 * gravada no formato `schema_version`.
 */
export const compendiumEntry = pgTable(
  "compendium_entry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: text("kind").notNull(),
    // Cópia de data.name, para listar e ordenar sem ler o documento.
    name: text("name").notNull(),
    // searchKey(name): sem acentos e minúsculo, para a busca (design B4).
    searchName: text("search_name").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    data: jsonb("data").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("compendium_entry_search_name_idx").on(table.searchName)],
);
