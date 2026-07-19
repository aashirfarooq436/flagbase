import type { ErrorResponse } from "@flagbase/contracts";

import { ApiError } from "../types/api-error";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Transport for the feature services: JSON fetch against `/api`, with error normalization.
 * A non-2xx response becomes a thrown `ApiError` carrying the server's code/message/fields, so
 * every caller handles failures the same way. The session cookie rides along automatically
 * (same-origin requests), so there's no auth header to manage here.
 */
export class BaseService {
  protected get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  protected post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  protected put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  protected patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  protected delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, body);
  }

  private async request<T>(
    method: Method,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`/api${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const data = (await response
        .json()
        .catch(() => null)) as ErrorResponse | null;
      throw new ApiError(
        response.status,
        data?.error?.code,
        data?.error?.message ?? "Request failed.",
        data?.error?.fields,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
