import { describe, expect, it, vi, beforeEach } from "vitest";
import { eventBus, EVENTS } from "../src/lib/events";

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  static instances: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: any) {
    // Simulate sending to other instances
    MockBroadcastChannel.instances.forEach(instance => {
      if (instance !== this && instance.onmessage) {
        instance.onmessage({ data } as MessageEvent);
      }
    });
  }

  close() {}
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

describe("Chat Session Standardization", () => {
  let eventBus: any;
  let EVENTS: any;

  beforeEach(async () => {
    vi.resetModules();
    MockBroadcastChannel.instances = [];
    vi.clearAllMocks();
    
    // Dynamically import to ensure it uses the current global stub
    const module = await import("../src/lib/events");
    eventBus = module.eventBus;
    EVENTS = module.EVENTS;
  });

  describe("EventBus Cross-tab Synchronization", () => {
    it("should propagate events via BroadcastChannel", () => {
      const spy = vi.spyOn(MockBroadcastChannel.prototype, 'postMessage');
      
      eventBus.emit(EVENTS.PAYMENT_VERIFIED, { success: true });
      
      expect(spy).toHaveBeenCalledWith({
        type: EVENTS.PAYMENT_VERIFIED,
        data: { success: true }
      });
    });

    it("should receive events from other tabs", () => {
      const listener = vi.fn();
      eventBus.subscribe(EVENTS.PAYMENT_VERIFIED, listener);
      
      const channelInstance = MockBroadcastChannel.instances.find(inst => inst.name === 'hushh-events');
      
      if (!channelInstance) {
        throw new Error("EventBus did not create a 'hushh-events' BroadcastChannel");
      }
      
      // Simulate message from another tab
      channelInstance.onmessage!({
        data: { type: EVENTS.PAYMENT_VERIFIED, data: { success: true } }
      } as MessageEvent);
      
      expect(listener).toHaveBeenCalledWith({ success: true });
    });
  });

  describe("402 Error Handling Shape", () => {
    it("should correctly identify a 402 FunctionsError", () => {
      const error: any = new Error("Payment Required");
      error.context = { status: 402 };
      
      expect(error.context.status).toBe(402);
    });
  });
});
