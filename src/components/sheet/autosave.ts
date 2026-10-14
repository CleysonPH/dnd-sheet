/*
 * Máquina de estados do salvamento automático (design C5). Função pura: os
 * eventos trazem o horário (`now`, em ms) e `nextSaveAt` diz quando o próximo
 * envio deve acontecer. O hook useSheetAutosave liga isso a timers e ao servidor.
 */

/** Pausa na digitação antes de enviar. */
export const DEBOUNCE_MS = 1500;
/** Tempo máximo entre a primeira edição não enviada e o envio. */
export const MAX_WAIT_MS = 5000;
/** Primeira espera depois de uma falha; dobra a cada falha seguida. */
export const RETRY_BASE_MS = 2000;
export const RETRY_MAX_MS = 30_000;

export type SaveFailure = "network" | "invalid" | "conflict" | "deleted";

export type AutosaveState<D> = {
  /** Versão da ficha no servidor em que a próxima gravação se baseia. */
  version: number;
  /** Documento mais recente na tela. */
  document: D;
  /** Há edições ainda não enviadas. */
  dirty: boolean;
  /** Há um envio em andamento. */
  inFlight: boolean;
  /** Horário da primeira edição não enviada (para o teto de MAX_WAIT_MS). */
  dirtySince: number | null;
  lastEditAt: number | null;
  failure: SaveFailure | null;
  retryAt: number | null;
  retryDelay: number;
};

export type AutosaveEvent<D> =
  | { type: "edit"; document: D; now: number }
  | { type: "saveStarted" }
  | { type: "saveSucceeded"; version: number }
  | { type: "saveFailed"; failure: SaveFailure; now: number };

export type AutosaveStatus =
  "saved" | "pending" | "saving" | "error" | "invalid" | "conflict" | "deleted";

export function initialAutosaveState<D>(
  document: D,
  version: number,
): AutosaveState<D> {
  return {
    version,
    document,
    dirty: false,
    inFlight: false,
    dirtySince: null,
    lastEditAt: null,
    failure: null,
    retryAt: null,
    retryDelay: RETRY_BASE_MS,
  };
}

/** Conflito ou ficha excluída: a edição fica bloqueada até recarregar. */
export function isLocked(state: AutosaveState<unknown>): boolean {
  return state.failure === "conflict" || state.failure === "deleted";
}

export function autosaveReducer<D>(
  state: AutosaveState<D>,
  event: AutosaveEvent<D>,
): AutosaveState<D> {
  switch (event.type) {
    case "edit":
      if (isLocked(state)) return state;
      return {
        ...state,
        document: event.document,
        dirty: true,
        lastEditAt: event.now,
        dirtySince: state.dirtySince ?? event.now,
        // Uma edição nova pode corrigir o que o servidor recusou.
        failure: state.failure === "invalid" ? null : state.failure,
      };

    case "saveStarted":
      // O documento enviado é o atual; edições a partir daqui ficam para o próximo envio.
      return { ...state, inFlight: true, dirty: false, dirtySince: null };

    case "saveSucceeded":
      return {
        ...state,
        version: event.version,
        inFlight: false,
        failure: null,
        retryAt: null,
        retryDelay: RETRY_BASE_MS,
      };

    case "saveFailed":
      if (event.failure === "conflict" || event.failure === "deleted") {
        return { ...state, inFlight: false, failure: event.failure };
      }
      if (event.failure === "invalid") {
        // Repetir não resolve: espera uma nova edição.
        return { ...state, inFlight: false, dirty: true, failure: "invalid" };
      }
      return {
        ...state,
        inFlight: false,
        dirty: true,
        failure: "network",
        retryAt: event.now + state.retryDelay,
        retryDelay: Math.min(state.retryDelay * 2, RETRY_MAX_MS),
      };
  }
}

/** Quando o próximo envio deve acontecer; `null` se não há nada a enviar agora. */
export function nextSaveAt(state: AutosaveState<unknown>): number | null {
  if (isLocked(state) || state.inFlight || !state.dirty) return null;
  if (state.failure === "invalid") return null;
  if (state.failure === "network") return state.retryAt;
  if (state.lastEditAt === null || state.dirtySince === null) return null;
  return Math.min(
    state.lastEditAt + DEBOUNCE_MS,
    state.dirtySince + MAX_WAIT_MS,
  );
}

export function autosaveStatus(state: AutosaveState<unknown>): AutosaveStatus {
  if (state.failure === "conflict") return "conflict";
  if (state.failure === "deleted") return "deleted";
  if (state.inFlight) return "saving";
  if (state.failure === "invalid") return "invalid";
  if (state.failure === "network") return "error";
  if (state.dirty) return "pending";
  return "saved";
}

/** Há algo que se perderia ao sair da página. */
export function hasUnsavedChanges(state: AutosaveState<unknown>): boolean {
  return !isLocked(state) && (state.dirty || state.inFlight);
}
