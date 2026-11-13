export interface AtlasPageSnapshot {
  title?: string | null;
  url?: string;
  pathname?: string;
}

export interface AtlasExtractedFields {
  atlasReference?: string | null;
  grantReference?: string | null;
  matterTitle?: string | null;
  clientName?: string | null;
  grantStatus?: string | null;
  claimStatus?: string | null;
  extensionStatus?: string | null;
  grantType?: string | null;
  workType?: string | null;
  grantExpiryAt?: string | null;
  claimCutoffAt?: string | null;
  nextReviewAt?: string | null;
  headings: string[];
  notes: string[];
  raw: Record<string, string>;
}

export interface AtlasCaptureResult {
  ok: true;
  page: {
    title: string;
    href: string;
    pathname: string;
    host: string;
    pageType: string;
  };
  extracted: AtlasExtractedFields;
  payload: import("./api").AtlasImportPayload;
  capturedAt: string;
}
