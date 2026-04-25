import { ApiClient } from "./apiClient";

export type AccessStatus = string;

export interface NDAStatus {
  hasSignedNda: boolean;
  signedAt: string | null;
  ndaVersion: string | null;
  signerName: string | null;
}

export interface SignNDAResult {
  success: boolean;
  signedAt?: string;
  signerName?: string;
  ndaVersion?: string;
  error?: string;
}

export interface NdaMetadataResponse {
  metadata?: Record<string, unknown>;
  message?: string;
  status?: string;
}

export class NdaService extends ApiClient {
  /**
   * Check if the current user has already signed an NDA or has a pending request.
   */
  static async checkAccessStatus(): Promise<AccessStatus> {
    return this.invoke<AccessStatus>("check_access_status");
  }

  /**
   * Check if the specific user has signed the NDA (Legacy RPC support)
   */
  static async checkNDAStatus(userId: string): Promise<NDAStatus> {
    // This method provides legacy support by calling the original RPC.
    // Consider migrating all call sites to use the newer, more abstract service methods.
    try {
      return await this.invoke<NDAStatus>("check_user_nda_status", { p_user_id: userId });
    } catch (err: any) {
      console.error("Error checking NDA status via legacy RPC:", err);
      return {
        hasSignedNda: false,
        signedAt: null,
        ndaVersion: null,
        signerName: null,
      };
    }
  }

  /**
   * Get the existing NDA metadata for the current user.
   */
  static async getNdaMetadata(): Promise<NdaMetadataResponse> {
    return this.invoke<NdaMetadataResponse>("get_nda_metadata");
  }

  /**
   * Accept the NDA (Version 2).
   */
  static async acceptNda(): Promise<AccessStatus> {
    return this.invoke<AccessStatus>("accept_nda_v2");
  }

  /**
   * Sign the global NDA (Legacy RPC support)
   */
  static async signNDA(
    signerName: string,
    ndaVersion: string = "v1.0",
    pdfUrl?: string
  ): Promise<SignNDAResult> {
    try {
      const data = await this.invoke<any>("accept_nda_v2", {
        signer_name: signerName,
        nda_version: ndaVersion,
        pdf_url: pdfUrl,
      });
      return {
        success: true,
        signerName,
        ndaVersion,
        signedAt: new Date().toISOString(),
        ...data,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Submit an NDA and Investor Profile request.
   */
  static async requestFileAccess(investorType: string, metadata: any): Promise<AccessStatus> {
    return this.invoke<AccessStatus>("request_file_access", {
      investor_type: investorType,
      metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata),
    });
  }

  /**
   * Generate an NDA PDF blob for the current user.
   */
  static async generateNdaPdfBlob(metadata: Record<string, unknown>): Promise<Blob> {
    return this.invoke<Blob>("generate_nda_pdf", { metadata }, { responseType: "blob" });
  }

  /**
   * Generate personalized NDA PDF (Legacy support)
   */
  static async generateNDAPdf(
    metadata: Record<string, unknown>,
    _accessToken: string
  ): Promise<{ success: boolean; pdfUrl?: string; blob?: Blob; error?: string }> {
    try {
      const blob = await this.generateNdaPdfBlob(metadata);
      return {
        success: true,
        pdfUrl: URL.createObjectURL(blob),
        blob,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Send NDA signed notification
   */
  static async sendNDANotification(payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      await this.invoke("nda-signed-notification", payload);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Upload signed NDA PDF to Supabase Storage
   */
  static async uploadSignedNDA(
    userId: string,
    pdfBlob: Blob
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // This still requires direct supabase access for storage unless we have an edge function for it.
    // For consistency with existing code that used config.supabaseClient:
    try {
      const { default: config } = await import("../../resources/config/config");
      if (!config.supabaseClient) throw new Error("Supabase client not initialized");

      const fileName = `nda_${userId}_${Date.now()}.pdf`;
      const filePath = `signed-ndas/${fileName}`;

      const { error } = await config.supabaseClient.storage
        .from("assets")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = config.supabaseClient.storage
        .from("assets")
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
