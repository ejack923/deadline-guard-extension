chrome.runtime.onInstalled.addListener(() => {
  console.log("Deadline Guard extension scaffold installed.");
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "deadline-guard.ping") {
    sendResponse({ ok: true });
  }
});
