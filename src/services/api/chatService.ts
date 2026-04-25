import { ApiClient } from "./apiClient";

export interface ChatAccessInfo {
  canChat: boolean;
  needsPayment: boolean;
  accessType: "free" | "paid" | "expired";
  messagesRemaining?: number | "unlimited";
  messagesUsed?: number;
  totalFreeMessages?: number;
  timeRemaining?: string;
  message?: string;
}

export interface ChatResponse {
  reply: string;
  accessInfo?: Partial<ChatAccessInfo>;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

/**
 * Service for interacting with chat-related Edge Functions.
 */
export class ChatService extends ApiClient {
  /**
   * Checks if the user has access to chat with a specific investor.
   */
  static async checkAccess(
    visitorId: string,
    slug: string
  ): Promise<ChatAccessInfo> {
    return this.invoke<ChatAccessInfo>("chat-check-access", { visitorId, slug });
  }

  /**
   * Sends a message to the investor assistant.
   */
  static async sendMessage(
    slug: string,
    message: string,
    visitorId: string,
    history: { role: string; content: string }[]
  ): Promise<ChatResponse> {
    return this.invoke<ChatResponse>("investor-chat", {
      slug,
      message,
      visitorId,
      history,
    });
  }

  /**
   * Verifies a checkout session after a successful payment.
   */
  static async verifyPayment(
    sessionId: string,
    visitorId: string,
    slug: string
  ): Promise<any> {
    return this.invoke("chat-verify-payment", { sessionId, visitorId, slug });
  }

  /**
   * Creates a checkout session for unlimited chat access.
   */
  static async createCheckout(
    visitorId: string,
    slug: string
  ): Promise<CheckoutResponse> {
    return this.invoke<CheckoutResponse>("chat-create-checkout", {
      visitorId,
      slug,
    });
  }
}
