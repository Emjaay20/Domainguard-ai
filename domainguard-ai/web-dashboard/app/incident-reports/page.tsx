"use client";

import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Threat } from "@/src/components/ThreatCard"; // Reusing your interface

export default function IncidentReports() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [loading, setLoading] = useState(true);

  // Reference to the document we want to print
  const reportRef = useRef<HTMLDivElement>(null);

  // Setup the print function
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: selectedThreat ? `Threat_Report_${selectedThreat.url}` : "Incident_Report",
  });

  useEffect(() => {
    fetch("http://localhost:8000/api/threats")
      .then((res) => res.json())
      .then((data) => {
        setThreats(data.data || []);
        if (data.data?.length > 0) setSelectedThreat(data.data[0]); // Auto-select the first one
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch threats:", err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="p-8 max-w-7xl mx-auto w-full h-full flex flex-col">
      <header className="mb-8 border-b border-slate-800/50 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Incident Reports</h1>
          <p className="text-slate-400 text-sm">Generate and export official security advisories for detected threats.</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={!selectedThreat}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export as PDF
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Threat Selector */}
        <div className="lg:col-span-4 bg-[#121620] border border-slate-800 rounded-xl p-4 overflow-y-auto h-[700px] shadow-lg">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Recent Intercepts</h2>
          {loading ? (
            <div className="animate-pulse space-y-3"><div className="h-16 bg-slate-800/50 rounded-lg w-full"></div></div>
          ) : (
            <div className="space-y-2">
              {threats.map((threat) => (
                <button
                  key={threat.id}
                  onClick={() => setSelectedThreat(threat)}
                  className={`w-full text-left p-4 rounded-lg transition-all border ${
                    selectedThreat?.id === threat.id 
                      ? "bg-indigo-500/10 border-indigo-500/30" 
                      : "bg-slate-900/50 border-transparent hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-white truncate pr-2">{threat.title || "Unknown Target"}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${threat.ai_sentiment_label === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {threat.structured_data?.threat_score || 0}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{threat.url}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Printable Report Preview */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-8 flex justify-center overflow-y-auto h-[700px] shadow-inner">
          
          {selectedThreat ? (
            <div 
              ref={reportRef} 
              className="bg-white w-[210mm] min-h-[297mm] p-12 text-slate-900 shadow-2xl"
              style={{ fontFamily: "Arial, sans-serif" }} // Ensure standard fonts for PDF printing
            >
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter">DomainGuard AI</h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Automated Security Advisory</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">Report ID: <span className="font-mono text-slate-600">{selectedThreat.id.substring(0, 8).toUpperCase()}</span></p>
                  <p className="text-sm text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Threat Overview */}
              <div className="mb-8">
                <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 uppercase">Target Overview</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-bold text-slate-500 block">Target URL:</span>
                    <span className="font-mono text-blue-600 break-all">{selectedThreat.url}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Captured Title:</span>
                    <span>{selectedThreat.title || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">AI Sentiment Classification:</span>
                    <span className={`font-bold ${selectedThreat.ai_sentiment_label === 'NEGATIVE' ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedThreat.ai_sentiment_label}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">Threat Score (Out of 100):</span>
                    <span className="font-bold text-xl">{selectedThreat.structured_data?.threat_score || 0}</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="mb-8 bg-slate-50 p-6 border-l-4 border-slate-900">
                <h2 className="text-lg font-bold mb-3 uppercase">Executive Intelligence Summary</h2>
                <p className="text-sm leading-relaxed text-slate-700">
                  {selectedThreat.structured_data?.executive_summary || "No summary available for this target."}
                </p>
              </div>

              {/* Technical Indicators */}
              <div>
                <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 uppercase">Technical Indicators of Compromise (IoCs)</h2>
                
                <div className="mb-6">
                  <span className="font-bold text-slate-500 block mb-2">Identified Threat Actor / Author:</span>
                  <p className="text-sm">{selectedThreat.structured_data?.author || "Unknown"}</p>
                </div>

                <div className="mb-6">
                  <span className="font-bold text-slate-500 block mb-2">Associated Network Nodes (Extracted Domains):</span>
                  {selectedThreat.structured_data?.network_nodes && selectedThreat.structured_data.network_nodes.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm space-y-1 font-mono">
                      {selectedThreat.structured_data.network_nodes.map((node, i) => (
                        <li key={i}>{node}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No network nodes detected.</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-20 pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
                <p>CONFIDENTIAL SECURITY ADVISORY • DO NOT DISTRIBUTE</p>
                <p>Generated by DomainGuard AI Local Llama 3 Inference Engine</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Select a threat from the left to view the report.
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
