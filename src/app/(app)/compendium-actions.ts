"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AuthError } from "@/server/auth/guards";
import {
  createEntry,
  deleteEntry,
  saveEntry,
  searchEntries,
  sendToCompendium,
  type CompendiumEntry,
  type CreateEntryResult,
  type DeleteEntryResult,
  type SaveEntryResult,
  type SendToCompendiumResult,
} from "@/server/compendium/service";

/*
 * Actions do compêndio (design B5), usadas pela página do admin e pela ficha.
 * Falhas de autorização viram navegação, como nas outras actions (design A4).
 */

async function withAuth<T>(run: (headers: Headers) => Promise<T>): Promise<T> {
  try {
    return await run(await headers());
  } catch (error) {
    if (!(error instanceof AuthError)) throw error;
    if (error.code === "FORBIDDEN") notFound();
    redirect(error.code === "UNAUTHENTICATED" ? "/login" : "/trocar-senha");
  }
}

export async function searchCompendiumAction(
  query: string,
  kinds: string[],
): Promise<CompendiumEntry[]> {
  return withAuth((h) => searchEntries(h, { query, kinds }));
}

export async function createEntryAction(
  kind: string,
  name: string,
): Promise<CreateEntryResult> {
  return withAuth((h) => createEntry(h, { kind, name }));
}

export async function saveEntryAction(
  id: string,
  source: unknown,
): Promise<SaveEntryResult> {
  return withAuth((h) => saveEntry(h, id, source));
}

export async function deleteEntryAction(
  id: string,
): Promise<DeleteEntryResult> {
  return withAuth((h) => deleteEntry(h, id));
}

export async function sendToCompendiumAction(
  source: unknown,
): Promise<SendToCompendiumResult> {
  return withAuth((h) => sendToCompendium(h, source));
}
