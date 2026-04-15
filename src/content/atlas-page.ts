import { buildAtlasImportPayload } from "./normalizers/atlas-import";
import { extractGrantSummaryPage } from "./extractors/grant-summary";

function detectAtlasPage() {
  return {
    title: document.title,
    href: window.location.href,
    pathname: window.location.pathname
  };
}

const page = detectAtlasPage();
const extracted = extractGrantSummaryPage(document);
const payload = buildAtlasImportPayload({
  extracted,
  page
});

console.debug("Deadline Guard content scaffold", payload);
