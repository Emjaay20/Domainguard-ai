"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Threat } from "@/src/components/ThreatCard"; // Reusing your Threat interface

export default function AdvancedScan() {
  const [bulkText, setBulkText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [targetCount, setTargetCount] = useState(0);
  
  // New States for Live Tracking
  const [activeBatchUrls, setActiveBatchUrls] = useState<string[]>([]);
  const [batchResults, setBatchResults] = useState<Threat[]>([]);

  // Parse raw text/CSV into an array of URLs
  const parseUrls = (text: string) => {
    const urls = text
      .split(/[\n,]+/)
      .map(url => url.trim())
      .filter(url => url.length > 0 && url.startsWith("http"));
    setTargetCount(urls.length);
    return urls;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBulkText(e.target.value);
    parseUrls(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkText(content);
      parseUrls(content);
      toast.success(`Loaded ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleBulkDeploy = async () => {
    const urls = parseUrls(bulkText);
    if (urls.length === 0) {
      toast.error("No valid URLs found. Make sure they include http:// or https://");
      return;
    }

    setIsScanning(true);
    setActiveBatchUrls(urls); // Lock in the URLs we are tracking
    setBatchResults([]); // Clear previous results

    const toastId = toast.loading(`Deploying fleet to ${urls.length} targets...`);

    try {
      await fetch("http://localhost:8000/api/scan/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      
      toast.success(`Successfully queued ${urls.length} targets!`, { id: toastId, duration: 5000 });
      setBulkText(""); // Clear input area
      setTargetCount(0);
    } catch (err) {
      toast.error("Failed to deploy bulk scan.", { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  // --- THE LIVE TRACKING ENGINE ---
  // This polls the API and cross-references it with our active batch URLs
  useEffect(() => {
    if (activeBatchUrls.length === 0) return;

    const pollResults = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/threats?limit=100");
        const data = await res.json();
        
        // Filter the global threat feed to ONLY include URLs from this specific batch
        const matchedThreats = data.data.filter((threat: Threat) => 
          activeBatchUrls.includes(threat.url)
        );
        
        setBatchResults(matchedThreats);
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Poll every 3 seconds while a batch is active
    const interval = setInterval(pollResults, 3000);
    return () => clearInterval(interval);
  }, [activeBatchUrls]);

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}} />

      <header className="mb-8 border-b border-slate-800/50 pb-6">
        <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Advanced Scan</h1>
        <p className="text-slate-400 text-sm">Deploy the ingestion fleet across multiple targets simultaneously.</p>
      </header>

      {/* TOP SECTION: Input and Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-2">
          <div className="bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-semibold text-white">Target List</h2>
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded transition-colors border border-slate-700">
                <span>Upload CSV / TXT</span>
                <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <textarea
              value={bulkText}
              onChange={handleTextChange}
              placeholder="Paste URLs here (one per line or comma-separated).&#10;Example:&#10;https://example.com&#10;https://github.com"
              className="w-full h-48 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-slate-900/50 border border-indigo-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
            
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Deployment Status</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-500 text-sm">Valid Targets</span>
                  <span className="text-indigo-400 font-mono font-bold text-lg">{targetCount}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBulkDeploy}
              disabled={isScanning || targetCount === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isScanning ? "Deploying Fleet..." : "Deploy Bulk Scan"}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Live Batch Results Table */}
      {activeBatchUrls.length > 0 && (
        <div className="bg-[#121620] border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div>
              <h2 className="text-lg font-semibold text-white">Live Batch Tracker</h2>
              <p className="text-xs text-slate-500 mt-1">Cross-referencing telemetry from Llama 3 engine.</p>
            </div>
            <div className="text-sm font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-md border border-slate-700">
              Completed: <span className="text-indigo-400 font-bold">{batchResults.length}</span> / {activeBatchUrls.length}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Target URL</th>
                  <th className="px-6 py-4">Processing Status</th>
                  <th className="px-6 py-4">AI Label</th>
                  <th className="px-6 py-4 text-right">Threat Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {activeBatchUrls.map((url, idx) => {
                  // Check if Llama 3 has finished parsing this specific URL
                  const result = batchResults.find(r => r.url === url);
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs truncate max-w-xs text-slate-300">{url}</td>
                      <td className="px-6 py-4">
                        {result ? (
                          <span className="flex items-center gap-2 text-emerald-400 font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Scanned
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-amber-500/80 font-medium animate-pulse">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            In Queue
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result ? (
                          <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                            result.ai_sentiment_label === 'NEGATIVE' ? 'bg-red-500/10 text-red-400' : 
                            result.ai_sentiment_label === 'BENIGN' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {result.ai_sentiment_label}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {result ? (
                          <span className={`font-mono font-bold ${
                            (result.structured_data?.threat_score || 0) > 75 ? 'text-red-400' : 'text-slate-300'
                          }`}>
                            {result.structured_data?.threat_score || 0}/100
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
