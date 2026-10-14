"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  autosaveReducer,
  autosaveStatus,
  hasUnsavedChanges,
  initialAutosaveState,
  isLocked,
  nextSaveAt,
  type SaveFailure,
} from "./autosave";

export type SaveOutcome =
  | { status: "saved"; version: number }
  | { status: "conflict" }
  | { status: "not_found" }
  | { status: "invalid" };

type Options<D> = {
  initialDocument: D;
  initialVersion: number;
  /** Envia o documento; lançar erro conta como falha de rede. */
  save: (baseVersion: number, document: D) => Promise<SaveOutcome>;
};

const FAILURES: Record<Exclude<SaveOutcome["status"], "saved">, SaveFailure> = {
  conflict: "conflict",
  not_found: "deleted",
  invalid: "invalid",
};

/**
 * Liga a máquina de estados do autosave (autosave.ts) a timers, ao servidor e
 * ao aviso de saída da página (design C5).
 */
export function useSheetAutosave<D>({
  initialDocument,
  initialVersion,
  save,
}: Options<D>) {
  const [state, dispatch] = useReducer(
    autosaveReducer<D>,
    initialAutosaveState(initialDocument, initialVersion),
  );
  const stateRef = useRef(state);
  const saveRef = useRef(save);

  useEffect(() => {
    stateRef.current = state;
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    const current = stateRef.current;
    if (nextSaveAt(current) === null) return;
    // Um envio por vez: edições durante o envio esperam a resposta (design C5).
    stateRef.current = { ...current, inFlight: true };
    dispatch({ type: "saveStarted" });
    try {
      const outcome = await saveRef.current(current.version, current.document);
      if (outcome.status === "saved") {
        dispatch({ type: "saveSucceeded", version: outcome.version });
      } else {
        dispatch({
          type: "saveFailed",
          failure: FAILURES[outcome.status],
          now: Date.now(),
        });
      }
    } catch {
      dispatch({ type: "saveFailed", failure: "network", now: Date.now() });
    }
  }, []);

  const dueAt = nextSaveAt(state);
  useEffect(() => {
    if (dueAt === null) return;
    const timer = setTimeout(flush, Math.max(0, dueAt - Date.now()));
    return () => clearTimeout(timer);
  }, [dueAt, flush]);

  const unsaved = hasUnsavedChanges(state);
  useEffect(() => {
    if (!unsaved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const edit = useCallback((document: D) => {
    dispatch({ type: "edit", document, now: Date.now() });
  }, []);

  return {
    document: state.document,
    status: autosaveStatus(state),
    locked: isLocked(state),
    edit,
  };
}
