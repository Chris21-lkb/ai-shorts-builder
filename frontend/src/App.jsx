import { useState } from "react";

const API = "http://127.0.0.1:8000/jobs";

export default function App() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [clips, setClips] = useState([]);
  const [running, setRunning] = useState(false);

  async function uploadFile() {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${API}/upload`, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setJobId(data.job_id);
  }

  async function startPipeline() {
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

  const progress = status?.progress ?? 0; // ✅ no ×100

  return (
    <div className="page">

      {/* Header */}
      <header className="header">
        <h1>🎬 AI Shorts Studio</h1>
        <span className="badge">MVP</span>
      </header>

      <div className="layout">

        {/* LEFT PANEL */}
        <div className="left">

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

            {jobId && <p className="muted">Job: {jobId}</p>}
          </div>

          {jobId && (
            <div className="card">
              <h3>Pipeline</h3>

              <button
                className="btn success"
                onClick={startPipeline}
                disabled={running}
              >
                {running ? "Processing…" : "Generate Shorts"}
              </button>

              {status && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="muted">
                    {status.stage} • {progress}%
                  </div>
                </>
              )}
            </div>
          )}

          {/* ✅ Download all */}
          {clips.length > 0 && (
            <div className="card">
              <a
                href={`${API}/${jobId}/download_zip`}
                className="btn"
              >
                Download All Shorts
              </a>
            </div>
          )}

        </div>

        {/* RIGHT PANEL */}
        <div className="right">

          <div className="card">
            <h3>Generated Shorts</h3>

            {clips.length === 0 && (
              <p className="muted">No clips yet</p>
            )}

            <div className="clips-grid">
              {clips.map((name) => (
                <div key={name} className="clip-card">
                  <video
                    src={`${API}/${jobId}/clips/${name}`}
                    controls
                  />

                  <a
                    href={`${API}/${jobId}/download/${name}`}
                    className="btn small"
                    download
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}