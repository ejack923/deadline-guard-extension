import type { AtlasImportPayload, ExtensionConfigResponse } from "../types/api";

interface RequestOptions extends RequestInit {
  baseUrl?: string;
}

function normalizeBaseUrl(baseUrl?: string) {
  return (baseUrl || "http://127.0.0.1:54322").replace(/\/+$/, "");
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const response = await fetch(`${normalizeBaseUrl(init?.baseUrl)}${path}`, {
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
  getConfig(baseUrl?: string) {
    return request<ExtensionConfigResponse>("/api/atlas/extension/config", { baseUrl });
  },
  submitImport(body: AtlasImportPayload, token?: string, idempotencyKey?: string, baseUrl?: string) {
    return request("/api/atlas/extension/import", {
      method: "POST",
      baseUrl,
      headers: {
        ...(token ? { "x-extension-token": token } : {}),
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {})
      },
      body: JSON.stringify(body)
    });
  },
  submitBatch(items: AtlasImportPayload[], token?: string, idempotencyKey?: string, baseUrl?: string) {
    return request("/api/atlas/extension/import-batch", {
      method: "POST",
      baseUrl,
      headers: {
        ...(token ? { "x-extension-token": token } : {}),
        ...(idempotencyKey ? { "x-idempotency-key": idempotencyKey } : {})
      },
      body: JSON.stringify({ items })
    });
  }
};
