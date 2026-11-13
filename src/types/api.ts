export interface ExtensionConfigResponse {
  ok: true;
  endpoint: string;
  batch_endpoint: string;
  auth: {
    header: string;
    required: boolean;
    optional_env: string;
  };
  idempotency: {
    header: string;
    supported: boolean;
  };
  duplicate_suppression: {
    enabled: boolean;
    based_on: string[];
  };
  accepted_payload_keys: string[];
  auth_enabled?: boolean;
}

export interface AtlasImportResponse {
  ok: boolean;
  duplicate?: boolean;
  import_id?: string | null;
  message?: string | null;
  [key: string]: unknown;
}

export interface RuntimeSubmitImportResponse {
  ok: boolean;
  response?: AtlasImportResponse;
  usedBackendUrl?: string;
  error?: string;
  queued?: boolean;
  queueSize?: number;
}

export interface QueueStatusResponse {
  ok: boolean;
  queueSize?: number;
  oldestQueuedAt?: string | null;
  lastError?: string | null;
  stalledCount?: number;
}

export interface AtlasImportPayload {
  atlas_reference: string;
  grant_reference?: string | null;
  matter_title?: string | null;
  client_name?: string | null;
  grant_status?: string | null;
  claim_status?: string | null;
  extension_status?: string | null;
  grant_type?: string | null;
  work_type?: string | null;
  grant_expiry_at?: string | null;
  claim_cutoff_at?: string | null;
  next_review_at?: string | null;
  source_meta?: {
    source_name?: string | null;
    extension_version?: string | null;
    browser_url?: string | null;
    content_script_version?: string | null;
  };
  page_meta?: {
    page_type?: string | null;
    page_title?: string | null;
    pathname?: string | null;
    host?: string | null;
  };
}

export interface QueuedAtlasImport {
  id: string;
  payload: AtlasImportPayload;
  idempotencyKey?: string;
  createdAt: string;
  lastAttemptAt?: string;
  retryCount: number;
  lastError?: string;
  stalled?: boolean;
}

export interface ImportHistoryEntry {
  id: string;
  status: "submitted" | "duplicate" | "queued" | "failed" | "dropped";
  createdAt: string;
  completedAt: string;
  atlasReference?: string | null;
  matterTitle?: string | null;
  message: string;
  backendUrl?: string | null;
  retryCount?: number;
}
