"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import ThreatCard, { Threat } from "@/src/components/ThreatCard";

export default function Dashboard() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://domainguard-ai.duckdns.org";


  const fetchThreats = () => {
    fetch(`${API_URL}/api/threats`)
      .then((res) => res.json())
      .then((data) => {
        setThreats(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch threats:", err);
        setLoading(false);
      });
  };

  const filteredThreats = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return threats.filter((threat) => {
      const score = threat.structured_data?.threat_score ?? 0;
      const matchesSentiment =
        sentimentFilter === "all" || threat.ai_sentiment_label === sentimentFilter;
      const matchesScore =
        scoreFilter === "all" ||
        (scoreFilter === "high" && score > 75) ||
        (scoreFilter === "medium" && score > 40 && score <= 75) ||
        (scoreFilter === "low" && score <= 40);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        threat.title.toLowerCase().includes(normalizedSearch) ||
        threat.url.toLowerCase().includes(normalizedSearch) ||
        (threat.structured_data?.main_topic || "").toLowerCase().includes(normalizedSearch);

      return matchesSentiment && matchesScore && matchesSearch;
    });
  }, [threats, sentimentFilter, scoreFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredThreats.length / itemsPerPage));
  const paginatedThreats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredThreats.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredThreats, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sentimentFilter, scoreFilter, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    fetchThreats();
    const pollingInterval = setInterval(fetchThreats, 3000);
    return () => clearInterval(pollingInterval);
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl) return;
    setIsScanning(true);
    const toastId = toast.loading("Deploying Scrapy Fleet...");

    try {
      await fetch(`${API_URL}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl }),
      });
      setScanUrl("");
      toast.success("Target locked! URL sent to ingestion queue.", { id: toastId, duration: 4000 });
    } catch (err) {
      toast.error("Failed to deploy scan.", { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }}} />

      {/* PAGE HEADER & SCANNER */}
      <header className="mb-8 flex justify-between items-end border-b border-slate-800/50 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Threat Stream</h1>
          <p className="text-slate-400 text-sm">Real-time analysis of intercepted suspicious network activity.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Scanning Live
          </div>
          
          <form onSubmit={handleScan} className="flex gap-2">
            <input 
              type="url" 
              required
              placeholder="Enter suspicious URL..." 
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 w-72 text-white shadow-inner"
            />
            <button 
              type="submit" 
              disabled={isScanning}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isScanning ? "Deploying..." : "Run Scan"}
            </button>
          </form>
        </div>
      </header>

      {/* FEED CONTENT */}
      {loading ? (
        <div className="animate-pulse space-y-4"><div className="h-48 bg-slate-800/50 rounded-xl w-full"></div></div>
      ) : filteredThreats.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl bg-slate-900/30">
          <p className="text-slate-500">No threats parsed yet. Deploy a scan above!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {paginatedThreats.map((threat) => (
            <ThreatCard key={threat.id} threat={threat} />
          ))}

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 flex-1">
                <label className="space-y-2 text-sm text-slate-400">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search title, URL, or topic"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-400">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Sentiment</span>
                  <select
                    value={sentimentFilter}
                    onChange={(e) => setSentimentFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="NEGATIVE">Negative</option>
                    <option value="POSITIVE">Positive</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-400">
                  <span className="block text-xs font-semibold uppercase tracking-widest text-slate-500">Risk Level</span>
                  <select
                    value={scoreFilter}
                    onChange={(e) => setScoreFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </label>
              </div>

              <div className="text-sm text-slate-400 lg:text-right">
                Showing <span className="text-white font-semibold">{paginatedThreats.length}</span> of <span className="text-white font-semibold">{filteredThreats.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Page {currentPage} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}