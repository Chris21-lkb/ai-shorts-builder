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
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🎬 AI Shorts Builder</h1>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={uploadFile} disabled={!file}>
        Upload
      </button>

      {jobId && (
        <>
          <p>Job: {jobId}</p>
          <button onClick={startPipeline} disabled={running}>
            Run Pipeline
          </button>
        </>
      )}

      {status && (
        <pre style={{ background: "#eee", padding: 10 }}>
          {JSON.stringify(status, null, 2)}
        </pre>
      )}

      {clips.length > 0 && (
        <>
          <h2>Generated Shorts</h2>

          {clips.map((name) => (
            <div key={name} style={{ marginBottom: 20 }}>
              <video
                width="240"
                controls
                src={`${API}/${jobId}/clips/${name}`}
              />
              <br />
              <a
                href={`${API}/${jobId}/clips/${name}`}
                download
              >
                Download
              </a>
            </div>
          ))}
        </>
      )}
    </div>
  );
}