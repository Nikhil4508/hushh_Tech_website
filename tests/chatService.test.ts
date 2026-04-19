import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatService } from "../src/services/api/chatService";
import { supabase } from "../src/lib/supabase";

// Mock the supabase client
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("ChatService", () => {
  const visitorId = "test-visitor-id";
  const slug = "test-investor-slug";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call checkAccess with correct parameters", async () => {
    const mockData = { canChat: true };
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await ChatService.checkAccess(visitorId, slug);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("chat-check-access", {
      body: { visitorId, slug },
    });
    expect(result).toEqual(mockData);
  });

  it("should call sendMessage with correct parameters", async () => {
    const message = "hello";
    const history = [{ role: "user", content: "hi" }];
    const mockResponse = { reply: "hi back" };
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: mockResponse,
      error: null,
    });

    const result = await ChatService.sendMessage(slug, message, visitorId, history);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("investor-chat", {
      body: { slug, message, visitorId, history },
    });
    expect(result).toEqual(mockResponse);
  });

  it("should handle errors from invoke", async () => {
    const mockError = new Error("Functions error");
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: mockError,
    });

    await expect(ChatService.checkAccess(visitorId, slug)).rejects.toThrow(
      "Functions error"
    );
  });
});
