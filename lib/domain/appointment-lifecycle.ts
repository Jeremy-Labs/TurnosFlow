import { AppointmentStatus } from "@prisma/client";

export class InvalidAppointmentTransitionError extends Error {
  constructor(
    public readonly currentStatus: AppointmentStatus,
    public readonly targetStatus: AppointmentStatus,
    message?: string
  ) {
    super(
      message ??
        `Transición de estado inválida: no se puede cambiar de ${currentStatus} a ${targetStatus}`
    );
    this.name = "InvalidAppointmentTransitionError";
  }
}

/**
 * Matriz de transiciones permitidas del ciclo de vida del turno:
 * - PENDING -> CONFIRMED, CANCELLED
 * - CONFIRMED -> COMPLETED, CANCELLED, NO_SHOW
 * - Estados terminales: COMPLETED, CANCELLED, NO_SHOW (no permiten transición)
 */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, ReadonlyArray<AppointmentStatus>> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

/**
 * Determina si la transición entre el estado actual y el objetivo es válida.
 * Nota: Si el estado objetivo es idéntico al actual (no-op), no se considera una transición válida
 * a menos que se desee permitir idempotencia explícita en otro nivel. En el dominio de estados,
 * solo se avanza a través del grafo de transiciones.
 */
export function isValidStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(nextStatus) : false;
}

/**
 * Obtiene la lista de transiciones permitidas para un estado dado.
 */
export function getAllowedTransitions(currentStatus: AppointmentStatus): AppointmentStatus[] {
  return [...(ALLOWED_TRANSITIONS[currentStatus] ?? [])];
}

/**
 * Valida la transición y lanza InvalidAppointmentTransitionError si no es válida.
 */
export function assertValidStatusTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus
): void {
  if (!isValidStatusTransition(currentStatus, nextStatus)) {
    throw new InvalidAppointmentTransitionError(currentStatus, nextStatus);
  }
}
