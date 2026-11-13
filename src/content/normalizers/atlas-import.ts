import type { AtlasImportPayload } from "../../types/api";
import type { AtlasExtractedFields } from "../../types/atlas";

interface BuildPayloadInput {
  extracted: AtlasExtractedFields;
  page: {
    title: string;
    href: string;
    pathname: string;
    host: string;
    pageType: string;
  };
}

export function buildAtlasImportPayload(input: BuildPayloadInput): AtlasImportPayload {
  return {
    atlas_reference: input.extracted.atlasReference || "",
    grant_reference: input.extracted.grantReference || null,
    matter_title: input.extracted.matterTitle || input.page.title || null,
    client_name: input.extracted.clientName || null,
    grant_status: input.extracted.grantStatus || null,
    claim_status: input.extracted.claimStatus || null,
    extension_status: input.extracted.extensionStatus || null,
    grant_type: input.extracted.grantType || null,
    work_type: input.extracted.workType || null,
    grant_expiry_at: input.extracted.grantExpiryAt || null,
    claim_cutoff_at: input.extracted.claimCutoffAt || null,
    next_review_at: input.extracted.nextReviewAt || null,
    source_meta: {
      source_name: "chrome_ex",
      extension_version: "0.1.0",
      browser_url: input.page.href,
      content_script_version: "0.1.0"
    },
    page_meta: {
      page_type: input.page.pageType,
      page_title: input.page.title,
      pathname: input.page.pathname,
      host: input.page.host
    }
  };
}
