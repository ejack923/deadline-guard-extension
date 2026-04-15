import type { AtlasImportPayload, ExtensionConfigResponse } from "../types/api";

const API_BASE = "http://127.0.0.1:54322";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const json = await response.json();

  if (!response.ok || json?.ok === false) {
    throw new Error(json?.error || `Request failed: ${path}`);
  }

  return json as T;
}

export const extensionApi = {
  getConfig() {
    return request<ExtensionConfigResponse>("/api/atlas/extension/config");
  },
  submitImport(body: AtlasImportPayload, token?: string, idempotencyKey?: string) {
    return request("/api/atlas/extension/import", {
      method: "POST",
      headers: {
        ...(token ? { "x-extension-token": token } : {}),
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {})
      },
      body: JSON.stringify(body)
    });
  },
  submitBatch(items: AtlasImportPayload[], token?: string, idempotencyKey?: string) {
    return request("/api/atlas/extension/import-batch", {
      method: "POST",
      headers: {
        ...(token ? { "x-extension-token": token } : {}),
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {})
      },
      body: JSON.stringify({ items })
    });
  }
};
