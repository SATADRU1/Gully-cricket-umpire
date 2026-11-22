import { computeInnings } from './engine';
import type { InningsConfig, InningsEvent, InningsState } from './types';

/** Event list with undo and redo. Undo just moves the last event to a second stack. */
export class EventLog<T = InningsEvent> {
  private done: T[];
  private undone: T[] = [];

  constructor(initial: T[] = []) {
    this.done = [...initial];
  }

  get events(): readonly T[] {
    return this.done;
  }
  get canUndo(): boolean {
    return this.done.length > 0;
  }
  get canRedo(): boolean {
    return this.undone.length > 0;
  }

  append(event: T): void {
    this.done.push(event);
    this.undone = []; // a new action ends the redo history
  }
  undo(): T | undefined {
    const e = this.done.pop();
    if (e !== undefined) this.undone.push(e);
    return e;
  }
  redo(): T | undefined {
    const e = this.undone.pop();
    if (e !== undefined) this.done.push(e);
    return e;
  }
}

/**
 * Validate first, then record. If the event is illegal this throws and the log
 * is left untouched. Returns the new state.
 */
export function applyEvent(
  config: InningsConfig,
  log: EventLog<InningsEvent>,
  event: InningsEvent,
): InningsState {
  const next = computeInnings(config, [...log.events, event]);
  log.append(event);
  return next;
}