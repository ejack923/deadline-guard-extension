export function extractGrantSummaryPage(documentRef: Document) {
  return {
    title: documentRef.title || null,
    headings: Array.from(documentRef.querySelectorAll("h1, h2"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)
  };
}
