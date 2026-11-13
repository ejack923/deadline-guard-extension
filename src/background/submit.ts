import { extensionApi } from "../lib/api-client";
import {
  addImportHistoryEntry,
  clearQueuedImports,
  enqueueImport,
  getExtensionSettings,
  getImportHistory,
  getQueuedImports,
  removeQueuedImport,
  updateQueuedImport
} from "../lib/storage";
import type {
  ImportHistoryEntry,
  AtlasImportPayload,
  AtlasImportResponse,
  QueuedAtlasImport,
  QueueStatusResponse,
  RuntimeSubmitImportResponse
} from "../types/api";

export interface SubmitImportRequest {
  payload: AtlasImportPayload;
  idempotencyKey?: string;
}

export interface SubmitImportResult {
  ok: true;
  response: AtlasImportResponse;
  usedBackendUrl: string;
}

const MAX_RETRY_COUNT = 3;

function createQueueId() {
  return `queued-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildHistoryEntry(input: {
  status: ImportHistoryEntry["status"];
  payload: AtlasImportPayload;
  message: string;
  backendUrl?: string | null;
  retryCount?: number;
}) {
  const now = new Date().toISOString();
  return {
    id: createQueueId(),
    status: input.status,
    createdAt: now,
    completedAt: now,
    atlasReference: input.payload.atlas_reference || null,
    matterTitle: input.payload.matter_title || null,
    message: input.message,
    backendUrl: input.backendUrl || null,
    retryCount: input.retryCount
  } satisfies ImportHistoryEntry;
}

async function performImport(request: SubmitImportRequest): Promise<SubmitImportResult> {
  const settings = await getExtensionSettings();

  const response = (await extensionApi.submitImport(
    request.payload,
    settings.extensionToken || undefined,
    request.idempotencyKey,
    settings.backendUrl
  )) as AtlasImportResponse;

  return {
    ok: true,
    response,
    usedBackendUrl: settings.backendUrl
  };
}

export async function submitAtlasImport(
  request: SubmitImportRequest
): Promise<RuntimeSubmitImportResponse> {
  try {
    const result = await performImport(request);
    await addImportHistoryEntry(
      buildHistoryEntry({
        status: result.response.duplicate ? "duplicate" : "submitted",
        payload: request.payload,
        message: result.response.duplicate ? "Duplicate suppressed by backend." : "Import submitted.",
        backendUrl: result.usedBackendUrl
      })
    );
    return result;
  } catch (error) {
    const queuedItem: QueuedAtlasImport = {
      id: createQueueId(),
      payload: request.payload,
      idempotencyKey: request.idempotencyKey,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      lastError: error instanceof Error ? error.message : "Import submission failed."
    };

    const queue = await enqueueImport(queuedItem);
    await addImportHistoryEntry(
      buildHistoryEntry({
        status: "queued",
        payload: request.payload,
        message: queuedItem.lastError || "Queued for retry."
      })
    );

    return {
      ok: true,
      queued: true,
      queueSize: queue.length,
      error: queuedItem.lastError
    };
  }
}

export async function retryQueuedImports() {
  const queue = await getQueuedImports();
  const attempts = queue.slice(0, 5);

  for (const item of attempts) {
    try {
      const result = await performImport({
        payload: item.payload,
        idempotencyKey: item.idempotencyKey
      });
      await removeQueuedImport(item.id);
      await addImportHistoryEntry(
        buildHistoryEntry({
          status: result.response.duplicate ? "duplicate" : "submitted",
          payload: item.payload,
          message: result.response.duplicate
            ? "Queued import resolved as duplicate."
            : "Queued import submitted.",
          backendUrl: result.usedBackendUrl,
          retryCount: item.retryCount
        })
      );
    } catch (error) {
      const nextRetryCount = item.retryCount + 1;
      const nextError = error instanceof Error ? error.message : "Retry failed.";

      if (nextRetryCount >= MAX_RETRY_COUNT) {
        await removeQueuedImport(item.id);
        await addImportHistoryEntry(
          buildHistoryEntry({
            status: "dropped",
            payload: item.payload,
            message: `Dropped after ${MAX_RETRY_COUNT} failed retries: ${nextError}`,
            retryCount: nextRetryCount
          })
        );
        continue;
      }

      await updateQueuedImport(item.id, (current) => ({
        ...current,
        retryCount: nextRetryCount,
        lastAttemptAt: new Date().toISOString(),
        lastError: nextError,
        stalled: nextRetryCount >= MAX_RETRY_COUNT - 1
      }));
    }
  }
}

export async function getQueueStatus(): Promise<QueueStatusResponse> {
  const queue = await getQueuedImports();
  const oldestItem = queue[0];

  return {
    ok: true,
    queueSize: queue.length,
    oldestQueuedAt: oldestItem?.createdAt || null,
    lastError: oldestItem?.lastError || null,
    stalledCount: queue.filter((item) => item.stalled).length
  };
}

export async function retryQueueNow() {
  await retryQueuedImports();
  return getQueueStatus();
}

export async function clearQueue() {
  const queue = await getQueuedImports();
  for (const item of queue) {
    await addImportHistoryEntry(
      buildHistoryEntry({
        status: "dropped",
        payload: item.payload,
        message: "Queue cleared manually.",
        retryCount: item.retryCount
      })
    );
  }

  await clearQueuedImports();
  return getQueueStatus();
}

export async function loadImportHistory() {
  const history = await getImportHistory();
  return {
    ok: true,
    items: history
  };
}
