export async function setExtensionValue(key: string, value: unknown) {
  await chrome.storage.local.set({ [key]: value });
}

export async function getExtensionValue<T>(key: string): Promise<T | undefined> {
  const value = await chrome.storage.local.get([key]);
  return value[key] as T | undefined;
}
