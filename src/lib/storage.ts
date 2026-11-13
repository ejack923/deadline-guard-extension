import { AUTH_STORAGE_KEY } from "./auth";
import { DEFAULT_BACKEND_URL } from "./env";
import type { ImportHistoryEntry, QueuedAtlasImport } from "../types/api";

export const BACKEND_URL_STORAGE_KEY = "deadline_guard_backend_url";
export const IMPORT_QUEUE_STORAGE_KEY = "deadline_guard_import_queue";
export const IMPORT_HISTORY_STORAGE_KEY = "deadline_guard_import_history";
const IMPORT_HISTORY_LIMIT = 12;

export interface ExtensionSettings {
  backendUrl: string;
  extensionToken: string;
}

export async function setExtensionValue(key: string, value: unknown) {
  await chrome.storage.local.set({ [key]: value });
}

export async function getExtensionValue<T>(key: string): Promise<T | undefined> {
  const value = await chrome.storage.local.get([key]);
  return value[key] as T | undefined;
}

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  const stored = await chrome.storage.local.get([BACKEND_URL_STORAGE_KEY, AUTH_STORAGE_KEY]);

  return {
    backendUrl: stored[BACKEND_URL_STORAGE_KEY] || DEFAULT_BACKEND_URL,
    extensionToken: stored[AUTH_STORAGE_KEY] || ""
  };
}

export async function saveExtensionSettings(settings: ExtensionSettings) {
  await chrome.storage.local.set({
    [BACKEND_URL_STORAGE_KEY]: settings.backendUrl.trim() || DEFAULT_BACKEND_URL,
    [AUTH_STORAGE_KEY]: settings.extensionToken.trim()
  });
}

export async function getQueuedImports(): Promise<QueuedAtlasImport[]> {
  const stored = await chrome.storage.local.get([IMPORT_QUEUE_STORAGE_KEY]);
  return (stored[IMPORT_QUEUE_STORAGE_KEY] as QueuedAtlasImport[] | undefined) || [];
}

export async function saveQueuedImports(items: QueuedAtlasImport[]) {
  await chrome.storage.local.set({
    [IMPORT_QUEUE_STORAGE_KEY]: items
  });
}

export async function enqueueImport(item: QueuedAtlasImport) {
  const queue = await getQueuedImports();
  queue.push(item);
  await saveQueuedImports(queue);
  return queue;
}

export async function removeQueuedImport(id: string) {
  const queue = await getQueuedImports();
  const nextQueue = queue.filter((item) => item.id !== id);
  await saveQueuedImports(nextQueue);
  return nextQueue;
}

export async function updateQueuedImport(
  id: string,
  updater: (item: QueuedAtlasImport) => QueuedAtlasImport
) {
  const queue = await getQueuedImports();
  const nextQueue = queue.map((item) => (item.id === id ? updater(item) : item));
  await saveQueuedImports(nextQueue);
  return nextQueue.find((item) => item.id === id);
}

export async function clearQueuedImports() {
  await saveQueuedImports([]);
}

export async function getImportHistory(): Promise<ImportHistoryEntry[]> {
  const stored = await chrome.storage.local.get([IMPORT_HISTORY_STORAGE_KEY]);
  return (stored[IMPORT_HISTORY_STORAGE_KEY] as ImportHistoryEntry[] | undefined) || [];
}

export async function addImportHistoryEntry(entry: ImportHistoryEntry) {
  const history = await getImportHistory();
  const nextHistory = [entry, ...history].slice(0, IMPORT_HISTORY_LIMIT);
  await chrome.storage.local.set({
    [IMPORT_HISTORY_STORAGE_KEY]: nextHistory
  });
  return nextHistory;
}
