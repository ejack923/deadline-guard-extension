export function extractClaimPage(documentRef: Document) {
  return {
    title: documentRef.title || null
  };
}
