import { buildAtlasImportPayload } from "./normalizers/atlas-import";
import { extractClaimPage } from "./extractors/claim-page";
import { extractExtensionPage } from "./extractors/extension-page";
import { extractGrantSummaryPage } from "./extractors/grant-summary";
import type { AtlasCaptureResult } from "../types/atlas";

function detectAtlasPage() {
  const title = document.title || "Untitled page";
  const href = window.location.href;
  const pathname = window.location.pathname;
  const pageHint = `${title} ${pathname}`.toLowerCase();

  let pageType = "unknown";
  if (pageHint.includes("grant") && pageHint.includes("summary")) {
    pageType = "grant-summary";
  } else if (pageHint.includes("claim")) {
    pageType = "claim";
  } else if (pageHint.includes("extension")) {
    pageType = "extension";
  }

  return {
    title,
    href,
    pathname,
    host: window.location.host,
    pageType
  };
}

function extractPage() {
  const page = detectAtlasPage();

  const extracted =
    page.pageType === "claim"
      ? extractClaimPage(document)
      : page.pageType === "extension"
        ? extractExtensionPage(document)
        : extractGrantSummaryPage(document);

  const payload = buildAtlasImportPayload({
    extracted,
    page
  });

  const result: AtlasCaptureResult = {
    ok: true,
    page,
    extracted,
    payload,
    capturedAt: new Date().toISOString()
  };

  return result;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "deadline-guard.capture-page") {
    sendResponse(extractPage());
    return false;
  }

  return false;
});

console.debug("Deadline Guard content script ready", extractPage());
