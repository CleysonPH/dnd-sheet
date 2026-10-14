import { describe, expect, it } from "vitest";

import {
  DEBOUNCE_MS,
  MAX_WAIT_MS,
  RETRY_MAX_MS,
  autosaveReducer,
  autosaveStatus,
  hasUnsavedChanges,
  initialAutosaveState,
  isLocked,
  nextSaveAt,
  type AutosaveEvent,
  type AutosaveState,
} from "./autosave";

type Doc = { text: string };

function run(
  events: AutosaveEvent<Doc>[],
  state: AutosaveState<Doc> = initialAutosaveState({ text: "" }, 1),
) {
  return events.reduce(autosaveReducer, state);
}

const edit = (text: string, now: number): AutosaveEvent<Doc> => ({
  type: "edit",
  document: { text },
  now,
});

describe("autosave", () => {
  it("começa salvo, sem nada a enviar", () => {
    const state = run([]);
    expect(autosaveStatus(state)).toBe("saved");
    expect(nextSaveAt(state)).toBeNull();
    expect(hasUnsavedChanges(state)).toBe(false);
  });

  it("agenda o envio 1,5 s depois da última edição", () => {
    const state = run([edit("a", 0), edit("ab", 1000)]);
    expect(autosaveStatus(state)).toBe("pending");
    expect(nextSaveAt(state)).toBe(1000 + DEBOUNCE_MS);
    expect(hasUnsavedChanges(state)).toBe(true);
  });

  it("em digitação contínua, envia no máximo 5 s depois da primeira edição", () => {
    const events = Array.from({ length: 20 }, (_, i) => edit(`t${i}`, i * 500));
    expect(nextSaveAt(run(events))).toBe(MAX_WAIT_MS);
  });

  it("salvamento ok volta a salvo com a nova versão", () => {
    const state = run([
      edit("a", 0),
      { type: "saveStarted" },
      { type: "saveSucceeded", version: 2 },
    ]);
    expect(autosaveStatus(state)).toBe("saved");
    expect(state.version).toBe(2);
    expect(nextSaveAt(state)).toBeNull();
  });

  it("não envia de novo enquanto há um envio em andamento", () => {
    const state = run([edit("a", 0), { type: "saveStarted" }, edit("ab", 100)]);
    expect(autosaveStatus(state)).toBe("saving");
    expect(nextSaveAt(state)).toBeNull();
  });

  it("edição durante o envio é enviada depois, com a versão devolvida", () => {
    const state = run([
      edit("a", 0),
      { type: "saveStarted" },
      edit("ab", 100),
      { type: "saveSucceeded", version: 2 },
    ]);
    expect(autosaveStatus(state)).toBe("pending");
    expect(state.version).toBe(2);
    expect(state.document).toEqual({ text: "ab" });
    expect(nextSaveAt(state)).toBe(100 + DEBOUNCE_MS);
  });

  it("falha de rede mantém a edição e tenta de novo em 2 s, 4 s, 8 s... até 30 s", () => {
    let state = run([edit("a", 0)]);
    const delays: number[] = [];
    let now = 2000;
    for (let i = 0; i < 6; i++) {
      state = run(
        [
          { type: "saveStarted" },
          { type: "saveFailed", failure: "network", now },
        ],
        state,
      );
      delays.push(nextSaveAt(state)! - now);
      now = nextSaveAt(state)!;
    }
    expect(delays).toEqual([2000, 4000, 8000, 16000, 30000, RETRY_MAX_MS]);
    expect(autosaveStatus(state)).toBe("error");
    expect(state.document).toEqual({ text: "a" });
    expect(hasUnsavedChanges(state)).toBe(true);
  });

  it("um sucesso depois de falhas zera a espera", () => {
    const state = run([
      edit("a", 0),
      { type: "saveStarted" },
      { type: "saveFailed", failure: "network", now: 2000 },
      { type: "saveStarted" },
      { type: "saveSucceeded", version: 2 },
      edit("ab", 10_000),
      { type: "saveStarted" },
      { type: "saveFailed", failure: "network", now: 12_000 },
    ]);
    expect(nextSaveAt(state)).toBe(12_000 + 2000);
  });

  it("conteúdo inválido não é reenviado até uma nova edição", () => {
    let state = run([
      edit("a", 0),
      { type: "saveStarted" },
      { type: "saveFailed", failure: "invalid", now: 2000 },
    ]);
    expect(autosaveStatus(state)).toBe("invalid");
    expect(nextSaveAt(state)).toBeNull();

    state = run([edit("ab", 3000)], state);
    expect(autosaveStatus(state)).toBe("pending");
    expect(nextSaveAt(state)).toBe(3000 + DEBOUNCE_MS);
  });

  it("conflito bloqueia a edição e não envia mais nada", () => {
    const state = run([
      edit("a", 0),
      { type: "saveStarted" },
      { type: "saveFailed", failure: "conflict", now: 2000 },
      edit("ignorada", 3000),
    ]);
    expect(autosaveStatus(state)).toBe("conflict");
    expect(isLocked(state)).toBe(true);
    expect(state.document).toEqual({ text: "a" });
    expect(nextSaveAt(state)).toBeNull();
    expect(hasUnsavedChanges(state)).toBe(false);
  });

  it("ficha excluída em outro lugar também bloqueia", () => {
    const state = run([
      edit("a", 0),
      { type: "saveStarted" },
      { type: "saveFailed", failure: "deleted", now: 2000 },
    ]);
    expect(autosaveStatus(state)).toBe("deleted");
    expect(isLocked(state)).toBe(true);
    expect(nextSaveAt(state)).toBeNull();
  });
});
