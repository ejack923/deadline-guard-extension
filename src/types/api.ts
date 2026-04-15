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
