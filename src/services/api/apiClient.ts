import { supabase } from "../../lib/supabase";

/**
 * Base services for interacting with Supabase Edge Functions.
 * Provides a standardized way to invoke functions with proper error handling.
 */
export class ApiClient {
  /**
   * Invokes a Supabase Edge Function by name.
   * @param functionName The name of the Edge Function to invoke.
   * @param body The payload to send to the function.
   * @param options Additional options to pass to the function invocation.
   * @returns A promise resolving to the function's output data.
   */
  protected static async invoke<T = any>(
    functionName: string,
    body?: any,
    options?: any
  ): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
      ...options,
    });

    if (error) {
      console.error(`[ApiClient] Error invoking ${functionName}:`, error);
      throw error;
    }

    return data as T;
  }
}
