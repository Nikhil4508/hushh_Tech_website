type Unsubscribe = () => void;
type Listener<T = any> = (data: T) => void;

/**
 * Lightweight event bus for application-wide notifications.
 * Used for reactive UI updates across components (e.g., payment verification).
 */
export class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel('hushh-events');
    
    // Listen for events from other tabs
    this.channel.onmessage = (event) => {
      const { type, data } = event.data;
      this.listeners.get(type)?.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in cross-tab event listener for "${type}":`, error);
        }
      });
    };
  }

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
   * Emit an event to all subscribers in this tab and other tabs.
   */
  emit<T = any>(event: string, data?: T): void {
    // Notify local listeners
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in local event listener for "${event}":`, error);
      }
    });
    
    // Notify other tabs
    this.channel.postMessage({ type: event, data });
  }
}

export const eventBus = new EventBus();

// Event names constants
export const EVENTS = {
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
} as const;
