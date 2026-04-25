import { ApiClient } from "./apiClient";

export type AccessStatus = string;

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
}
