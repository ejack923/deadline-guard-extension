import type { AtlasImportPayload } from "../../types/api";

interface BuildPayloadInput {
  extracted: {
    title?: string | null;
    headings?: Array<string | undefined>;
  };
  page: {
    title?: string | null;
    href?: string;
    pathname?: string;
  };
}

export function buildAtlasImportPayload(input: BuildPayloadInput): AtlasImportPayload {
  return {
    atlas_reference: "",
    matter_title: input.extracted.title || input.page.title || null,
    source_meta: {
      source_name: "chrome_ex",
      extension_version: "0.1.0",
      browser_url: input.page.href || null,
      content_script_version: "0.1.0"
    },
    page_meta: {
      page_type: "unknown",
      page_title: input.page.title || null,
      pathname: input.page.pathname || null,
      host: typeof window !== "undefined" ? window.location.host : null
    }
  };
}
