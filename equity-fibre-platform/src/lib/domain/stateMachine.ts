/**
 * Generic, centralised state-transition guard.
 *
 * Every stateful entity defines an allowed-transitions map and uses
 * `assertTransition` / `canTransition`. Impossible transitions are rejected;
 * callers record who/what initiated the change plus previous/new state via the
 * audit service. This prevents "one uncontrolled string field" drift.
 */

export type TransitionMap<S extends string> = Record<S, readonly S[]>;

export class InvalidTransitionError extends Error {
  constructor(
    public readonly entity: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super(`Invalid ${entity} transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition<S extends string>(
  map: TransitionMap<S>,
  from: S,
  to: S,
): boolean {
  const allowed = map[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function assertTransition<S extends string>(
  entity: string,
  map: TransitionMap<S>,
  from: S,
  to: S,
): void {
  if (!canTransition(map, from, to)) {
    throw new InvalidTransitionError(entity, from, to);
  }
}
