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

  // ---------- upload ----------
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

  // ---------- from URL ----------
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

  // ---------- pipeline ----------
  async function startPipeline() {
    if (!jobId) return;

    setRunning(true);

    await fetch(`${API}/${jobId}/run_all_async`, {
      method: "POST",
    });

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

  // ---------- downloads ----------
  function downloadClip(name) {
    window.location.href = `${API}/${jobId}/download/${name}`;
  }

  // function downloadAll() {
  //   clips.forEach((name, i) => {
  //     setTimeout(() => downloadClip(name), i * 400);
  //   });
  // }

  function downloadAll() {
    window.location.href = `${API}/${jobId}/download_zip`;
  }


  const progress = stageToPercent(status);

  return (
    <div className="app-root">

      {/* HEADER */}
      <header className="topbar">
        <div className="logo">🎬 AI Shorts Studio</div>
        <div className="badge">URL + Upload</div>
      </header>

      <div className="layout">

        {/* LEFT PANEL */}
        <div className="left-panel">

          {/* Upload */}
          <div className="card">
            <h3>Upload Video</h3>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button
              className="btn primary"
              onClick={uploadFile}
              disabled={!file}
            >
              Upload
            </button>
          </div>

          {/* URL */}
          <div className="card">
            <h3>From URL</h3>

            <input
              type="text"
              placeholder="Paste YouTube link…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <button
              className="btn ghost"
              onClick={createFromUrl}
              disabled={!url}
            >
              Fetch Video
            </button>
          </div>

          {/* Pipeline */}
          <div className="card">
            <h3>Pipeline</h3>

            <button
              className="btn accent"
              onClick={startPipeline}
              disabled={!jobId || running}
            >
              Generate Shorts
            </button>

            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="progress-text">
              {running ? `${progress}%` : status?.state || "idle"}
            </div>
          </div>

          {/* Download all */}
          <div className="card">
            <button
              className="btn ghost"
              disabled={!clips.length}
              onClick={downloadAll}
            >
              Download All Shorts
            </button>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <h3>Generated Shorts</h3>

          {clips.length === 0 && (
            <div className="empty">
              No shorts yet — upload or fetch a video.
            </div>
          )}

          <div className="clips-grid">
            {clips.map((name) => (
              <div key={name} className="clip-card">
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
        </div>

      </div>
    </div>
  );
}