import { describe, it, expect, vi, beforeEach } from "vitest";
import { NdaService } from "../src/services/api/ndaService";
import { NdaRequestSchema } from "../src/services/api/ndaSchema";
import { supabase } from "../src/lib/supabase";

// Mock supabase
vi.mock("../src/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("NdaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should invoke check_access_status RPC", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: "Approved", error: null });
    const result = await NdaService.checkAccessStatus();
    expect(supabase.functions.invoke).toHaveBeenCalledWith("check_access_status", { body: undefined });
    expect(result).toBe("Approved");
  });

  it("should invoke request_file_access with stringified metadata", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: "Pending", error: null });
    const metadata = { name: "Test User" };
    await NdaService.requestFileAccess("Individual", metadata);
    expect(supabase.functions.invoke).toHaveBeenCalledWith("request_file_access", {
      body: {
        investor_type: "Individual",
        metadata: JSON.stringify(metadata),
      },
    });
  });

  it("should throw error if RPC fails", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: new Error("RPC Failed") });
    await expect(NdaService.checkAccessStatus()).rejects.toThrow("RPC Failed");
  });
});

describe("NdaSchema", () => {
  it("should validate a correct individual profile", () => {
    const data = {
      investorType: "Individual",
      metadata: {
        name: "John Doe",
        state: "CA",
        city: "San Francisco",
        country: "USA",
        individual_address: "123 Main St",
        legal_email: "john@example.com",
        mobile_telephone: "+1234567890",
      },
    };
    const result = NdaRequestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should fail validation for missing fields", () => {
    const data = {
      investorType: "Individual",
      metadata: {
        name: "John Doe",
        // missing fields
      },
    };
    const result = NdaRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should fail validation for invalid email", () => {
    const data = {
      investorType: "Individual",
      metadata: {
        name: "John Doe",
        state: "CA",
        city: "SF",
        country: "USA",
        individual_address: "123",
        legal_email: "invalid-email",
        mobile_telephone: "12345",
      },
    };
    const result = NdaRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid email format.");
    }
  });
});
