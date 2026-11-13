export const runtimeChannel = {
  ping: "deadline-guard.ping",
  submitImport: "deadline-guard.submit-import",
  getSettings: "deadline-guard.get-settings",
  getQueueStatus: "deadline-guard.get-queue-status",
  retryQueueNow: "deadline-guard.retry-queue-now",
  clearQueue: "deadline-guard.clear-queue",
  getImportHistory: "deadline-guard.get-import-history"
} as const;
