import { getExtensionSettings } from "../lib/storage";
import { registerExtensionAlarms, RETRY_IMPORTS_ALARM } from "./alarms";
import { runtimeChannel } from "./runtime";
import {
  clearQueue,
  getQueueStatus,
  loadImportHistory,
  retryQueueNow,
  retryQueuedImports,
  submitAtlasImport
} from "./submit";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Deadline Guard extension scaffold installed.");
  void registerExtensionAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  void registerExtensionAlarms();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_IMPORTS_ALARM) {
    void retryQueuedImports();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === runtimeChannel.ping) {
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === runtimeChannel.getSettings) {
    void getExtensionSettings()
      .then((settings) => sendResponse({ ok: true, settings }))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Could not load extension settings."
        })
      );
    return true;
  }

  if (message?.type === runtimeChannel.submitImport) {
    void submitAtlasImport(message)
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Import submission failed."
        })
      );
    return true;
  }

  if (message?.type === runtimeChannel.getQueueStatus) {
    void getQueueStatus()
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Could not load queue status."
        })
      );
    return true;
  }

  if (message?.type === runtimeChannel.retryQueueNow) {
    void retryQueueNow()
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Could not retry queue."
        })
      );
    return true;
  }

  if (message?.type === runtimeChannel.clearQueue) {
    void clearQueue()
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Could not clear queue."
        })
      );
    return true;
  }

  if (message?.type === runtimeChannel.getImportHistory) {
    void loadImportHistory()
      .then((result) => sendResponse(result))
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Could not load import history."
        })
      );
    return true;
  }

  return false;
});
