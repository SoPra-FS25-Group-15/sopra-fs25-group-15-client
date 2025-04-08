import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";

export class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiDomain();
  }

  /**
   * Helper function to always include the latest token and required headers in every request.
   */
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem("token") || "";
    return {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      // Use the "Authorization" header with a Bearer prefix.
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Helper function to check the response, parse JSON,
   * and throw an error if the response is not OK.
   *
   * @param res - The response from fetch.
   * @param errorMessage - A descriptive error message for this call.
   * @returns Parsed JSON data.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(res: Response, errorMessage: string): Promise<T> {
    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorInfo = await res.json();
        if (errorInfo?.message) {
          errorDetail = errorInfo.message;
        } else {
          errorDetail = JSON.stringify(errorInfo);
        }
      } catch {
        // If parsing fails, keep using res.statusText
      }
      const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
      const error: ApplicationError = new Error(detailedMessage) as ApplicationError;
      error.info = JSON.stringify({ status: res.status, statusText: res.statusText }, null, 2);
      error.status = res.status;
      throw error;
    }

    // If the response status is 204 (No Content), return null.
    if (res.status === 204) {
      return null as unknown as T;
    }

    // Alternatively, check if the response body is empty.
    const text = await res.text();
    if (!text) {
      return null as unknown as T;
    }

    return JSON.parse(text) as T;
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param init - Additional request options to merge.
   * @returns JSON data of type T.
   */
  public async get<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = this.getHeaders();
    const customHeaders = (init && init.headers) || {};
    const headers = { ...defaultHeaders, ...customHeaders };

    const res = await fetch(url, {
      method: "GET",
      headers,
      ...init,
    });
    return this.processResponse<T>(res, "An error occurred while fetching the data.\n");
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post.
   * @param init - Additional request options to merge.
   * @returns JSON data of type T.
   */
  public async post<T>(endpoint: string, data: unknown, init?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = this.getHeaders();
    const customHeaders = (init && init.headers) || {};
    const headers = { ...defaultHeaders, ...customHeaders };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      ...init,
    });
    return this.processResponse<T>(res, "An error occurred while posting the data.\n");
  }

  /**
   * PUT request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - The payload to update.
   * @param init - Additional request options to merge.
   * @returns JSON data of type T.
   */
  public async put<T>(endpoint: string, data: unknown, init?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = this.getHeaders();
    const customHeaders = (init && init.headers) || {};
    const headers = { ...defaultHeaders, ...customHeaders };

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      ...init,
    });
    return this.processResponse<T>(res, "An error occurred while updating the data.\n");
  }

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param init - Additional request options to merge.
   * @returns JSON data of type T.
   */
  public async delete<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const defaultHeaders = this.getHeaders();
    const customHeaders = (init && init.headers) || {};
    const headers = { ...defaultHeaders, ...customHeaders };

    const res = await fetch(url, {
      method: "DELETE",
      headers,
      ...init,
    });
    return this.processResponse<T>(res, "An error occurred while deleting the data.\n");
  }
}