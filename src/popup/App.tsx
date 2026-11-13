import { useEffect, useState, type CSSProperties } from "react";
import { runtimeChannel } from "../background/runtime";
import type {
  AtlasImportResponse,
  ImportHistoryEntry,
  QueueStatusResponse,
  RuntimeSubmitImportResponse
} from "../types/api";
import type { AtlasCaptureResult } from "../types/atlas";

type SubmitState = "idle" | "capturing" | "submitting";

async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function captureCurrentTab(): Promise<AtlasCaptureResult> {
  const tabId = await getActiveTabId();

  if (!tabId) {
    throw new Error("No active tab is available.");
  }

  const response = await chrome.tabs.sendMessage(tabId, { type: "deadline-guard.capture-page" });
  if (!response?.ok) {
    throw new Error("The active tab did not return a capture payload.");
  }

  return response as AtlasCaptureResult;
}

function buildIdempotencyKey(capture: AtlasCaptureResult) {
  return [
    capture.page.pathname,
    capture.payload.atlas_reference || "no-atlas-reference",
    capture.capturedAt
  ].join("::");
}

const panelStyle: CSSProperties = {
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid rgba(90, 123, 143, 0.22)",
  borderRadius: 16,
  padding: 14
};

export function App() {
  const [capture, setCapture] = useState<AtlasCaptureResult | null>(null);
  const [status, setStatus] = useState("Inspecting active tab...");
  const [submitState, setSubmitState] = useState<SubmitState>("capturing");
  const [submitResponse, setSubmitResponse] = useState<AtlasImportResponse | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatusResponse | null>(null);
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);

  async function refreshQueueStatus() {
    const response = (await chrome.runtime.sendMessage({
      type: runtimeChannel.getQueueStatus
    })) as QueueStatusResponse;
    setQueueStatus(response);
  }

  async function refreshHistory() {
    const response = (await chrome.runtime.sendMessage({
      type: runtimeChannel.getImportHistory
    })) as { ok: boolean; items?: ImportHistoryEntry[] };
    setHistory(response.items || []);
  }

  async function refreshCapture() {
    setSubmitState("capturing");
    setSubmitResponse(null);
    setStatus("Capturing ATLAS page details...");

    try {
      const result = await captureCurrentTab();
      setCapture(result);
      setStatus(`Capture ready from ${result.page.pageType} page.`);
    } catch (error) {
      setCapture(null);
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not capture the active tab. Open an ATLAS page and try again."
      );
    } finally {
      setSubmitState("idle");
    }
  }

  useEffect(() => {
    void refreshCapture();
    void refreshQueueStatus();
    void refreshHistory();
  }, []);

  async function handleRetryQueueNow() {
    setStatus("Retrying queued imports...");
    const response = (await chrome.runtime.sendMessage({
      type: runtimeChannel.retryQueueNow
    })) as QueueStatusResponse;
    setQueueStatus(response);
    await refreshHistory();
    setStatus(response.ok ? "Queue retry completed." : "Queue retry failed.");
  }

  async function handleClearQueue() {
    setStatus("Clearing retry queue...");
    const response = (await chrome.runtime.sendMessage({
      type: runtimeChannel.clearQueue
    })) as QueueStatusResponse;
    setQueueStatus(response);
    await refreshHistory();
    setStatus(response.ok ? "Retry queue cleared." : "Could not clear retry queue.");
  }

  async function handleSubmit() {
    if (!capture) {
      return;
    }

    setSubmitState("submitting");
    setStatus("Submitting capture to backend...");

    try {
      const response = (await chrome.runtime.sendMessage({
        type: runtimeChannel.submitImport,
        payload: capture.payload,
        idempotencyKey: buildIdempotencyKey(capture)
      })) as RuntimeSubmitImportResponse;

      if (!response?.ok || !response.response) {
        if (response?.queued) {
          setStatus(
            `Backend unavailable. Capture queued for retry${response.queueSize ? ` (${response.queueSize} queued)` : ""}.`
          );
          await refreshQueueStatus();
          await refreshHistory();
          return;
        }

        throw new Error(response?.error || "Background submission failed.");
      }

      setSubmitResponse(response.response as AtlasImportResponse);
      setStatus(
        response.response.duplicate
          ? `Duplicate suppressed by backend at ${response.usedBackendUrl}.`
          : `Capture submitted to ${response.usedBackendUrl}.`
      );
      await refreshQueueStatus();
      await refreshHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitState("idle");
    }
  }

  return (
    <main
      style={{
        minWidth: 380,
        padding: 16,
        fontFamily: "Segoe UI, sans-serif",
        background:
          "radial-gradient(circle at top left, #f8fcff 0%, #edf4f8 48%, #dde9f1 100%)",
        color: "#173247"
      }}
    >
      <section style={{ ...panelStyle, marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5b7690" }}>
          Deadline Guard
        </p>
        <h1 style={{ margin: "8px 0 6px", fontSize: 21 }}>ATLAS Capture</h1>
        <p style={{ margin: 0, color: "#4a6478", lineHeight: 1.45 }}>{status}</p>
      </section>

      <section style={{ ...panelStyle, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => void refreshCapture()}
            disabled={submitState !== "idle"}
            style={{
              flex: 1,
              borderRadius: 999,
              border: "1px solid #9ab4c8",
              background: "#fff",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {submitState === "capturing" ? "Refreshing..." : "Refresh Capture"}
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={!capture || submitState !== "idle"}
            style={{
              flex: 1,
              borderRadius: 999,
              border: 0,
              background: "#0b7d69",
              color: "#fff",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {submitState === "submitting" ? "Submitting..." : "Submit"}
          </button>
        </div>
      </section>

      {capture ? (
        <>
          <section style={{ ...panelStyle, marginBottom: 12 }}>
            <h2 style={{ marginTop: 0, fontSize: 15 }}>Page</h2>
            <p style={{ margin: "0 0 6px" }}>
              <strong>Type:</strong> {capture.page.pageType}
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>Title:</strong> {capture.page.title}
            </p>
            <p style={{ margin: 0, wordBreak: "break-word", color: "#4a6478" }}>
              {capture.page.href}
            </p>
          </section>

          <section style={{ ...panelStyle, marginBottom: 12 }}>
            <h2 style={{ marginTop: 0, fontSize: 15 }}>Payload Preview</h2>
            <p style={{ margin: "0 0 6px" }}>
              <strong>ATLAS Ref:</strong> {capture.payload.atlas_reference || "Not detected"}
            </p>
            <p style={{ margin: "0 0 6px" }}>
              <strong>Matter:</strong> {capture.payload.matter_title || "Not detected"}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Grant Ref:</strong> {capture.payload.grant_reference || "Not detected"}
            </p>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0, fontSize: 15 }}>Extracted Notes</h2>
            <p style={{ marginTop: 0, color: "#4a6478" }}>
              {capture.extracted.headings.slice(0, 3).join(" | ") || "No headings captured."}
            </p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontSize: 12,
                lineHeight: 1.45,
                color: "#28455a"
              }}
            >
              {JSON.stringify(capture.payload, null, 2)}
            </pre>
          </section>
        </>
      ) : null}

      {submitResponse ? (
        <section style={{ ...panelStyle, marginTop: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Backend Response</h2>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
            {JSON.stringify(submitResponse, null, 2)}
          </pre>
        </section>
      ) : null}

      {queueStatus?.ok ? (
        <section style={{ ...panelStyle, marginTop: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Retry Queue</h2>
          <p style={{ margin: "0 0 6px" }}>
            <strong>Queued imports:</strong> {queueStatus.queueSize || 0}
          </p>
          <p style={{ margin: "0 0 6px", color: "#4a6478" }}>
            {queueStatus.oldestQueuedAt
              ? `Oldest queued at ${new Date(queueStatus.oldestQueuedAt).toLocaleString()}.`
              : "No queued imports."}
          </p>
          <p style={{ margin: "0 0 10px", color: "#4a6478" }}>
            <strong>Stalled items:</strong> {queueStatus.stalledCount || 0}
          </p>
          {queueStatus.lastError ? (
            <p style={{ margin: "0 0 10px", color: "#8a4d22" }}>{queueStatus.lastError}</p>
          ) : null}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => void handleRetryQueueNow()}
              style={{
                flex: 1,
                borderRadius: 999,
                border: "1px solid #9ab4c8",
                background: "#fff",
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Retry Now
            </button>
            <button
              onClick={() => void handleClearQueue()}
              style={{
                flex: 1,
                borderRadius: 999,
                border: "1px solid #d6a484",
                background: "#fff8f3",
                color: "#8a4d22",
                padding: "10px 14px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Clear Queue
            </button>
          </div>
        </section>
      ) : null}

      {history.length ? (
        <section style={{ ...panelStyle, marginTop: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: 15 }}>Recent Activity</h2>
          <div style={{ display: "grid", gap: 10 }}>
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid rgba(90, 123, 143, 0.18)",
                  borderRadius: 12,
                  padding: 10,
                  background: "#fbfdff"
                }}
              >
                <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
                  {item.status.toUpperCase()} {item.atlasReference ? ` | ${item.atlasReference}` : ""}
                </p>
                <p style={{ margin: "0 0 4px", color: "#4a6478" }}>
                  {item.matterTitle || "Untitled matter"}
                </p>
                <p style={{ margin: "0 0 4px", color: "#4a6478" }}>{item.message}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#6a8295" }}>
                  {new Date(item.completedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
