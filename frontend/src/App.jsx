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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">🎬 AI Shorts Studio</h1>
            <p className="text-slate-400 text-sm">
              Turn long videos into vertical shorts automatically
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-600/20 border border-emerald-600/30 rounded-lg">
            MVP
          </span>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-12 gap-8">

        {/* LEFT PANEL */}
        <div className="col-span-12 md:col-span-4 space-y-6">

          <Panel title="Upload">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm"
            />

            <button
              onClick={uploadFile}
              disabled={!file}
              className="btn-primary mt-4 w-full"
            >
              Upload Video
            </button>

            {jobId && (
              <div className="text-xs text-slate-500 mt-3 break-all">
                Job: {jobId}
              </div>
            )}
          </Panel>

          <Panel title="Pipeline">
            <button
              onClick={startPipeline}
              disabled={!jobId || running}
              className="btn-accent w-full"
            >
              {running ? "Processing…" : "Generate Shorts"}
            </button>

            {status && (
              <div className="mt-3 text-sm text-slate-400">
                Status: {status.state}
              </div>
            )}
          </Panel>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-12 md:col-span-8">

          <Panel title="Generated Shorts">

            {clips.length === 0 && (
              <div className="text-slate-500 text-sm">
                No shorts yet — run the pipeline.
              </div>
            )}

            {/* ✅ GRID — SIDE BY SIDE */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">

              {clips.map((name) => (
                <div
                  key={name}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3"
                >
                  <video
                    controls
                    className="w-full rounded-lg bg-black"
                    style={{ aspectRatio: "9 / 16", maxHeight: 420 }}
                    src={`${API}/${jobId}/clips/${name}`}
                  />

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-slate-400">
                      {name}
                    </span>

                    <a
                      href={`${API}/${jobId}/clips/${name}`}
                      download
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}

            </div>

          </Panel>
        </div>

      </main>

      <style>{`
        .btn-primary {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
        }
        .btn-primary:disabled { opacity:.4 }

        .btn-accent {
          background: linear-gradient(135deg,#10b981,#06b6d4);
          padding: 12px;
          border-radius: 12px;
          font-weight: 600;
        }
        .btn-accent:disabled { opacity:.4 }
      `}</style>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="font-semibold mb-4 text-lg">{title}</h2>
      {children}
    </div>
  );
}