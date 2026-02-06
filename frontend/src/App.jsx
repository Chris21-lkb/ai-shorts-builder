import { useState } from "react";

export default function App() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:8000";

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);

    const res = await fetch(`${API}/jobs/upload`, {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    setJobId(data.job_id);
    setLoading(false);
  }

  async function runPipeline() {
    if (!jobId) return;
    setLoading(true);

    await fetch(`${API}/jobs/${jobId}/run-all`, {
      method: "POST",
    });

    setLoading(false);
    pollStatus();
  }

  async function pollStatus() {
    if (!jobId) return;

    const timer = setInterval(async () => {
      const res = await fetch(`${API}/jobs/${jobId}/status`);
      const data = await res.json();
      setStatus(data);

      if (data.stage === "done") {
        clearInterval(timer);
        loadOutputs();
      }
    }, 2000);
  }

  async function loadOutputs() {
    const res = await fetch(`${API}/jobs/${jobId}/outputs`);
    const data = await res.json();
    setFiles(data.files || []);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-slate-900/70 backdrop-blur rounded-2xl shadow-2xl p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">🎬 AI Shorts Builder</h1>
          <p className="text-slate-400">Upload a long video → get vertical captioned shorts automatically</p>
        </header>

        {/* Upload */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-4 border border-slate-700">
          <h2 className="text-lg font-semibold">1️⃣ Upload Video</h2>
          <input
            type="file"
            accept="video/*"
            onChange={uploadFile}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:bg-indigo-600 file:text-white
                       hover:file:bg-indigo-500 cursor-pointer"
          />

          {jobId && (
            <div className="text-xs text-slate-400">
              Job ID: <span className="font-mono">{jobId}</span>
            </div>
          )}
        </div>

        {/* Run */}
        <div className="bg-slate-800 rounded-xl p-6 space-y-4 border border-slate-700">
          <h2 className="text-lg font-semibold">2️⃣ Generate Shorts</h2>
          <button
            onClick={runPipeline}
            disabled={!jobId || loading}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 transition font-semibold"
          >
            {loading ? "Processing…" : "Run Full Pipeline"}
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-2">
            <h2 className="text-lg font-semibold">3️⃣ Status</h2>
            <div className="flex justify-between text-sm">
              <span>Stage</span>
              <span className="font-mono text-indigo-400">{status.stage}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>State</span>
              <span>{status.state}</span>
            </div>
          </div>
        )}

        {/* Outputs */}
        {files.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
            <h2 className="text-lg font-semibold">4️⃣ Generated Shorts</h2>
            <div className="grid gap-3">
              {files.map((f, i) => (
                <a
                  key={i}
                  href={`${API}${f}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
                >
                  ⬇️ Download clip {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}