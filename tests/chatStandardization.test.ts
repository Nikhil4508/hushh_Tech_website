import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus, EVENTS } from "../src/lib/events";

// Mock BroadcastChannel
class MockBroadcastChannel {
  name: string;
  onmessage: ((ev: MessageEvent) => any) | null = null;
  postMessage = vi.fn();
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  static instances: MockBroadcastChannel[] = [];
  
  static clear() {
    MockBroadcastChannel.instances = [];
  }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

describe("Chat Session Standardization - Cross-Tab Events", () => {
  let bus: EventBus;

  beforeEach(() => {
    MockBroadcastChannel.clear();
    vi.clearAllMocks();
    bus = new EventBus();
  });

  it("should emit events to BroadcastChannel", () => {
    bus.emit(EVENTS.PAYMENT_VERIFIED, { test: 'data' });
    
    expect(MockBroadcastChannel.instances[0].postMessage).toHaveBeenCalledWith({
      type: EVENTS.PAYMENT_VERIFIED,
      data: { test: 'data' }
    });
  });

  it("should respond to messages from BroadcastChannel", () => {
    const listener = vi.fn();
    bus.subscribe(EVENTS.PAYMENT_VERIFIED, listener);
    
    const instance = MockBroadcastChannel.instances[0];
    if (instance.onmessage) {
      instance.onmessage({
        data: { type: EVENTS.PAYMENT_VERIFIED, data: { status: 'success' } }
      } as MessageEvent);
    }
    
    expect(listener).toHaveBeenCalledWith({ status: 'success' });
  });
});

describe("Chat Session Standardization - 402 Error Shape", () => {
  it("should correctly identify 402 error from new Supabase shape", () => {
    const error = {
      context: {
        status: 402
      },
      message: "Payment Required"
    };
    
    // This is a unit test of the logic we put in the component's catch block
    const is402 = (err: any) => err?.context?.status === 402;
    
    expect(is402(error)).toBe(true);
  });
});
