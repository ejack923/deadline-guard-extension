export function extractExtensionPage(documentRef: Document) {
  return {
    title: documentRef.title || null
  };
}
