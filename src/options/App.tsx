import { useEffect, useState, type CSSProperties } from "react";
import { extensionApi } from "../lib/api-client";
import { DEFAULT_BACKEND_URL } from "../lib/env";
import { getExtensionSettings, saveExtensionSettings } from "../lib/storage";

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #d8e2ec",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 12px 30px rgba(28, 39, 49, 0.08)"
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #b7c8d8",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  marginTop: 8
};

export function App() {
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [extensionToken, setExtensionToken] = useState("");
  const [status, setStatus] = useState("Loading saved settings...");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    void getExtensionSettings().then((settings) => {
      setBackendUrl(settings.backendUrl);
      setExtensionToken(settings.extensionToken);
      setStatus("Settings loaded.");
    });
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setStatus("Saving settings...");

    try {
      await saveExtensionSettings({ backendUrl, extensionToken });
      setStatus("Settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);
    setStatus("Checking backend config...");

    try {
      const response = await extensionApi.getConfig(backendUrl);
      setStatus(
        `Backend reachable. Auth header: ${response.auth.header}. Batch endpoint: ${response.batch_endpoint}`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Backend check failed.");
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: "Segoe UI, sans-serif",
        background:
          "linear-gradient(180deg, #f3f7fb 0%, #eef4f8 55%, #e4edf4 100%)",
        color: "#163247",
        padding: 24
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gap: 18 }}>
        <section style={cardStyle}>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#52718a" }}>
            Deadline Guard
          </p>
          <h1 style={{ margin: "8px 0 12px", fontSize: 30 }}>Extension Settings</h1>
          <p style={{ margin: 0, lineHeight: 1.5, color: "#456178" }}>
            Save the backend URL and optional extension token used when the popup submits
            ATLAS captures.
          </p>
        </section>

        <section style={cardStyle}>
          <label style={{ display: "block", fontWeight: 600 }}>
            Backend URL
            <input
              style={inputStyle}
              value={backendUrl}
              onChange={(event) => setBackendUrl(event.target.value)}
              placeholder={DEFAULT_BACKEND_URL}
            />
          </label>

          <label style={{ display: "block", fontWeight: 600, marginTop: 18 }}>
            Extension Token
            <input
              style={inputStyle}
              value={extensionToken}
              onChange={(event) => setExtensionToken(event.target.value)}
              placeholder="Optional x-extension-token value"
            />
          </label>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "11px 18px",
                background: "#0f6cbd",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={handleTest}
              disabled={isTesting}
              style={{
                border: "1px solid #9db7cb",
                borderRadius: 999,
                padding: "11px 18px",
                background: "#fff",
                color: "#163247",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {isTesting ? "Testing..." : "Test Backend"}
            </button>
          </div>

          <p style={{ marginBottom: 0, marginTop: 18, color: "#456178" }}>{status}</p>
        </section>
      </div>
    </main>
  );
}
