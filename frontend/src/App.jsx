import { useState } from "react";

const API = "http://127.0.0.1:8000/jobs";
const STAGE_COUNT = 7;

function stageToPercent(status) {
  if (!status) return 0;
  if (status.state === "done") return 100;
  const p = status.progress ?? 0;
  return Math.min(100, Math.round((p / STAGE_COUNT) * 100));
}

export default function App() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [clips, setClips] = useState([]);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("upload");

  async function uploadFile() {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: form });
    const data = await res.json();
    setJobId(data.job_id);
    setStatus(null);
    setClips([]);
  }

  async function createFromUrl() {
    const res = await fetch(`${API}/from_url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setJobId(data.job_id);
    setStatus(null);
    setClips([]);
  }

  async function startPipeline() {
    if (!jobId) return;
    setRunning(true);
    await fetch(`${API}/${jobId}/run_all_async`, { method: "POST" });
    pollStatus(jobId);
  }

  function pollStatus(id) {
    const timer = setInterval(async () => {
      const res = await fetch(`${API}/${id}/status`);
      const data = await res.json();
      setStatus(data);

      if (data.state === "done") {
        clearInterval(timer);
        setRunning(false);
        loadClips(id);
      }
    }, 2000);
  }

  async function loadClips(id) {
    const res = await fetch(`${API}/${id}/clips`);
    const data = await res.json();
    setClips(data.clips || []);
  }

  function downloadClip(name) {
    window.location.href = `${API}/${jobId}/download/${name}`;
  }

  function downloadAll() {
    window.location.href = `${API}/${jobId}/download_zip`;
  }

  const progress = stageToPercent(status);

  return (
    <div className="app">

      {/* NAV */}
      <header className="nav">
        <div className="nav-left">
          <div className="brand">▶ 2short.ai</div>
          <div className="nav-links">
            <span className="active">Dashboard</span>
            <span>My Content</span>
            <span>Pricing</span>
          </div>
        </div>
        <div className="avatar">J</div>
      </header>

      <div className="page">

        {/* HERO */}
        <div className="hero-card">
          <h1>Upload Your Long Video</h1>
          <p>Transform your content into engaging short videos with the power of AI.</p>

          <div className="tabs">
            <button
              className={mode === "upload" ? "tab active" : "tab"}
              onClick={() => setMode("upload")}
            >
              Upload Video
            </button>
            <button
              className={mode === "url" ? "tab active" : "tab"}
              onClick={() => setMode("url")}
            >
              YouTube Link
            </button>
          </div>

          {mode === "upload" && (
            <>
              <label className="dropzone">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div>
                  <div className="drop-icon">⬆</div>
                  <div>Drag & drop your video here</div>
                  <div className="drop-sub">MP4, MOV, AVI</div>
                </div>
              </label>

              <button
                className="btn purple"
                disabled={!file}
                onClick={uploadFile}
              >
                Upload
              </button>
            </>
          )}

          {mode === "url" && (
            <div className="url-row">
              <input
                type="text"
                placeholder="Paste a YouTube video URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="btn purple"
                disabled={!url}
                onClick={createFromUrl}
              >
                Fetch
              </button>
            </div>
          )}

          <button
            className="btn generate"
            disabled={!jobId || running}
            onClick={startPipeline}
          >
            Generate Shorts
          </button>

          <div className="progress">
            <div className="bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* STATUS BANNER */}
        {status?.state === "done" && (
          <div className="status-banner">
            <div>✅ Processing Complete</div>
            <div>{clips.length} Shorts Created</div>
            <button className="btn white" onClick={downloadAll}>
              Download All
            </button>
          </div>
        )}

        {/* RESULTS */}
        <div className="results">
          <div className="results-left">
            <h2>Your Auto-Generated Shorts</h2>

            {clips.length === 0 && (
              <div className="empty">No shorts yet — upload or paste a link.</div>
            )}

            <div className="clips-grid">
              {clips.map((name) => (
                <div key={name} className="clip-card">
                  <video src={`${API}/${jobId}/clips/${name}`} controls />
                  <button
                    className="btn small"
                    onClick={() => downloadClip(name)}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="tips">
            <h3>Tips for Going Viral</h3>
            <ul>
              <li>🔥 Hook viewers quickly</li>
              <li>⚡ Keep it snappy</li>
              <li>😊 Add captions & emojis</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}