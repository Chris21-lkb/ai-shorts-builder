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
    await fetch(`${API}/${jobId}/run_all_async`, { method: "POST" });
    pollStatus(jobId);
  }

  async function pollStatus(id) {
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

  return (
    <div className="app-shell">

      <header className="header">
        <div className="header-inner">
          <div>
            <h1>🎬 AI Shorts Studio</h1>
            <div style={{color:"#9aa4af", fontSize:14}}>
              Long video → viral vertical clips
            </div>
          </div>
          <div>MVP</div>
        </div>
      </header>

      <main className="container">

        {/* LEFT PANEL */}
        <div>

          <div className="card">
            <h2>Upload</h2>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <button
              className="btn btn-primary"
              onClick={uploadFile}
              disabled={!file}
            >
              Upload Video
            </button>

            {jobId && (
              <div style={{fontSize:12, marginTop:10, color:"#9aa4af"}}>
                Job: {jobId}
              </div>
            )}
          </div>

          <div className="card" style={{marginTop:20}}>
            <h2>Pipeline</h2>

            <button
              className="btn btn-accent"
              onClick={startPipeline}
              disabled={!jobId || running}
            >
              {running ? "Processing…" : "Generate Shorts"}
            </button>

            {status && (
              <div style={{marginTop:10, fontSize:14}}>
                Status: {status.state}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="card">
          <h2>Generated Shorts</h2>

          {clips.length === 0 && (
            <div style={{color:"#9aa4af"}}>
              No clips yet — run pipeline.
            </div>
          )}

          <div className="clips-grid">
            {clips.map((name) => (
              <div key={name} className="clip-card">
                <video
                  controls
                  src={`${API}/${jobId}/clips/${name}`}
                />
                <div className="clip-footer">
                  <span>{name}</span>
                  {/* <a href={`${API}/${jobId}/clips/${name}`} download>
                    Download
                  </a> */}
                  <a href={`${API}/${jobId}/download/${name}`} className="download-btn">⬇ Download</a>
                </div>
              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  );
}