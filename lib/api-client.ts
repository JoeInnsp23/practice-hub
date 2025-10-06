import toast from "react-hot-toast";

interface FetchOptions extends RequestInit {
  retry?: number;
  retryDelay?: number;
  timeout?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private defaultOptions: FetchOptions;

  constructor(baseUrl = "", defaultOptions: FetchOptions = {}) {
    this.baseUrl = baseUrl;
    this.defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
      retry: 3,
      retryDelay: 1000,
      timeout: 30000,
      ...defaultOptions,
    };
  }

  private async fetchWithRetry(
    url: string,
    options: FetchOptions = {},
  ): Promise<Response> {
    const {
      retry = 3,
      retryDelay = 1000,
      timeout = 30000,
      ...fetchOptions
    } = {
      ...this.defaultOptions,
      ...options,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retry; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          return response;
        }

        // Retry on server errors (5xx)
        if (response.status >= 500 && attempt < retry - 1) {
          const delay = retryDelay * 2 ** attempt; // Exponential backoff
          await this.sleep(delay);
          continue;
        }

        return response;
      } catch (error: unknown) {
        const resolvedError =
          error instanceof Error ? error : new Error("Unknown request error");
        lastError = resolvedError;

        if (resolvedError.name === "AbortError") {
          lastError = new Error(`Request timeout after ${timeout}ms`);
        }

        // Don't retry on last attempt
        if (attempt === retry - 1) {
          break;
        }

        // Exponential backoff with jitter
        const delay = retryDelay * 2 ** attempt + Math.random() * 1000;
        await this.sleep(delay);
      }
    }

    throw lastError || new Error("Failed to fetch");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async handleResponse<T = unknown>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: Record<string, unknown> & {
        error?: string;
        message?: string;
      };
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const error = new Error(
        errorData.error || errorData.message || "Request failed",
      ) as ApiError;
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle empty responses
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return null as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return (await response.text()) as T;
  }

  async get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: "GET",
    });
    return this.handleResponse<T>(response);
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: FetchOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T = unknown>(
    endpoint: string,
    options?: FetchOptions,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      ...options,
      method: "DELETE",
    });
    return this.handleResponse<T>(response);
  }

  // Upload files with progress tracking
  async upload(
    endpoint: string,
    formData: FormData,
    options?: FetchOptions & {
      onProgress?: (progress: number) => void;
    },
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    // Remove content-type header for multipart/form-data
    const headers = new Headers(this.defaultOptions.headers);
    headers.delete("Content-Type");

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      // Track upload progress
      if (options?.onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            options.onProgress?.(progress);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          const error = new Error(
            `Upload failed: ${xhr.statusText}`,
          ) as ApiError;
          error.status = xhr.status;
          try {
            error.data = JSON.parse(xhr.responseText);
          } catch {
            error.data = xhr.responseText;
          }
          reject(error);
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("timeout", () => {
        reject(new Error("Upload timeout"));
      });

      xhr.open("POST", url);

      // Set headers
      headers.forEach((value, key) => {
        if (value) {
          xhr.setRequestHeader(key, value);
        }
      });

      // Set timeout
      xhr.timeout = options?.timeout || 60000;

      xhr.send(formData);
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient("/api");

// Helper functions with error handling
export async function fetchWithErrorHandling<T = unknown>(
  fetcher: () => Promise<T>,
  options?: {
    showError?: boolean;
    errorMessage?: string;
    retryable?: boolean;
  },
): Promise<T | null> {
  const { showError = true, errorMessage, retryable = true } = options || {};

  try {
    return await fetcher();
  } catch (error: unknown) {
    console.error("API Error:", error);

    const apiError = (
      error instanceof Error ? error : new Error("An error occurred")
    ) as ApiError;
    const message = errorMessage || apiError.message || "An error occurred";

    if (showError) {
      if (
        retryable &&
        typeof apiError.status === "number" &&
        apiError.status >= 500
      ) {
        toast.error(`${message}. Please try again.`, {
          duration: 5000,
        });
      } else {
        toast.error(message);
      }
    }

    // Re-throw for component to handle if needed
    throw apiError;
  }
}

// Export configured client
export default apiClient;
