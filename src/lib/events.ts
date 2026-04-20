type Unsubscribe = () => void;
type Listener<T = any> = (data: T) => void;

/**
 * Lightweight event bus for application-wide notifications.
 * Used for reactive UI updates across components (e.g., payment verification).
 */
class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  /**
   * Subscribe to an event.
   * @returns An unsubscribe function.
   */
  subscribe<T = any>(event: string, listener: Listener<T>): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit an event to all subscribers.
   */
  emit<T = any>(event: string, data?: T): void {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }
}

export const eventBus = new EventBus();

// Event names constants
export const EVENTS = {
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
} as const;
