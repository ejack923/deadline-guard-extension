import type { AtlasExtractedFields } from "../../types/atlas";

const LABEL_SELECTORS = [
  "dt",
  "th",
  "td:first-child",
  ".label",
  ".field-label",
  "[data-label]"
].join(", ");

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[:*]+$/g, "")
    .trim();
}

function cleanupValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function collectPairs(documentRef: Document) {
  const raw: Record<string, string> = {};

  for (const labelNode of Array.from(documentRef.querySelectorAll(LABEL_SELECTORS))) {
    const label = cleanupValue(labelNode.textContent || "");
    if (!label || label.length > 80) {
      continue;
    }

    const normalizedLabel = normalizeLabel(label);
    let value = "";

    if (labelNode.tagName === "DT") {
      value = cleanupValue(labelNode.nextElementSibling?.textContent || "");
    } else if (labelNode.tagName === "TH") {
      const row = labelNode.closest("tr");
      value = cleanupValue(row?.querySelector("td")?.textContent || "");
    } else if (labelNode.tagName === "TD") {
      const row = labelNode.closest("tr");
      const cells = Array.from(row?.querySelectorAll("td") || []);
      value = cleanupValue(cells[1]?.textContent || "");
    } else {
      const siblingText = cleanupValue(labelNode.nextElementSibling?.textContent || "");
      const parentText = cleanupValue(labelNode.parentElement?.textContent || "");
      value = siblingText || parentText.replace(label, "").trim();
    }

    if (value) {
      raw[normalizedLabel] = value;
    }
  }

  return raw;
}

function pickFirst(raw: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const exact = raw[alias];
    if (exact) {
      return exact;
    }
  }

  for (const [key, value] of Object.entries(raw)) {
    if (aliases.some((alias) => key.includes(alias))) {
      return value;
    }
  }

  return null;
}

export function extractCommonAtlasFields(documentRef: Document): AtlasExtractedFields {
  const raw = collectPairs(documentRef);
  const headings = Array.from(documentRef.querySelectorAll("h1, h2, h3"))
    .map((node) => cleanupValue(node.textContent || ""))
    .filter(Boolean)
    .slice(0, 8);

  const notes = Array.from(documentRef.querySelectorAll(".notice, .warning, .alert, [role='alert']"))
    .map((node) => cleanupValue(node.textContent || ""))
    .filter(Boolean)
    .slice(0, 6);

  return {
    atlasReference: pickFirst(raw, ["atlas reference", "atlas ref", "file reference", "matter reference"]),
    grantReference: pickFirst(raw, ["grant reference", "grant ref", "grant number"]),
    matterTitle: pickFirst(raw, ["matter title", "matter", "title"]),
    clientName: pickFirst(raw, ["client name", "client"]),
    grantStatus: pickFirst(raw, ["grant status", "status"]),
    claimStatus: pickFirst(raw, ["claim status"]),
    extensionStatus: pickFirst(raw, ["extension status"]),
    grantType: pickFirst(raw, ["grant type"]),
    workType: pickFirst(raw, ["work type"]),
    grantExpiryAt: pickFirst(raw, ["grant expiry", "expiry date", "grant expiry date"]),
    claimCutoffAt: pickFirst(raw, ["claim cutoff", "claim cut-off", "claim due"]),
    nextReviewAt: pickFirst(raw, ["next review", "review date"]),
    headings,
    notes,
    raw
  };
}
