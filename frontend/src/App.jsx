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
  const [mode, setMode] = useState("upload"); // upload | url

  async function uploadFile() {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: form,
    });

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

      {/* NAVBAR */}
      <header className="nav">
        <div className="nav-left">
          <div className="logo">▶ 2short.ai</div>
          <nav>
            <span className="nav-item active">Dashboard</span>
            <span className="nav-item">My Content</span>
            <span className="nav-item">Pricing</span>
          </nav>
        </div>
        <div className="nav-right">
          <div className="avatar">J</div>
        </div>
      </header>

      <main className="container">

        {/* HERO CARD */}
        <section className="hero-card">
          <h1>Upload Your Long Video</h1>
          <p>Transform your content into engaging short videos with AI</p>

          {/* MODE TABS */}
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

          {/* TAB CONTENT */}
          {mode === "upload" && (
            <div className="input-row">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <button
                className="btn primary"
                disabled={!file}
                onClick={uploadFile}
              >
                Upload
              </button>
            </div>
          )}

          {mode === "url" && (
            <div className="input-row">
              <input
                type="text"
                placeholder="Paste YouTube URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <button
                className="btn primary"
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

          {/* PROGRESS */}
          <div className="progress-wrap">
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{running ? `${progress}%` : status?.state || "idle"}</span>
          </div>
        </section>

        {/* RESULTS */}
        <section className="results-card">
          <div className="results-header">
            <h2>Your Auto-Generated Shorts</h2>
            <button
              className="btn ghost"
              disabled={!clips.length}
              onClick={downloadAll}
            >
              Download All
            </button>
          </div>

          {clips.length === 0 && (
            <div className="empty">
              No shorts yet — upload or paste a link.
            </div>
          )}

          <div className="grid">
            {clips.map((name) => (
              <div key={name} className="clip">
                <video
                  src={`${API}/${jobId}/clips/${name}`}
                  controls
                />
                <button
                  className="btn small"
                  onClick={() => downloadClip(name)}
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}