import React from 'react';

// 1. Updated Interface matching Llama 3's new output
export interface Threat {
  id: string;
  url: string;
  title: string;
  ai_sentiment_label: string;
  structured_data: {
    author: string | null;
    main_topic: string | null;
    extracted_urls: string[];
    executive_summary?: string;
    threat_score?: number;
    network_nodes?: string[];
  };
}

export default function ThreatCard({ threat }: { threat: Threat }) {
  const { title, url, ai_sentiment_label, structured_data } = threat;
  
  // Dynamic styling based on the AI label
  const isNegative = ai_sentiment_label === 'NEGATIVE';
  const tagColors = isNegative 
    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  // Dynamic Threat Score coloring
  const score = structured_data?.threat_score || 0;
  let scoreColor = 'text-emerald-400';
  let severity = 'LOW';
  if (score > 75) { scoreColor = 'text-red-400'; severity = 'CRITICAL'; }
  else if (score > 40) { scoreColor = 'text-amber-400'; severity = 'ELEVATED'; }

  return (
    <div className="bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg hover:border-slate-700 transition-all">
      
      {/* HEADER: Title, URL, and Status Tag */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            {title || "Unknown Target"}
          </h2>
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-slate-400 hover:text-indigo-400 truncate block max-w-xl flex items-center gap-2">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            {url}
          </a>
        </div>
        <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-widest border flex items-center gap-2 ${tagColors}`}>
          {isNegative && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
          {ai_sentiment_label}
        </span>
      </div>

      {/* BLUF: Executive Summary */}
      {structured_data?.executive_summary && (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-800/50">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-400 mr-2">AI Summary:</span>
            {structured_data.executive_summary}
          </p>
        </div>
      )}

      {/* BODY: Split Data View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-t border-slate-800/80 pt-6">
        
        {/* Left Column: Author & Threat Score */}
        <div className="col-span-4 space-y-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Identified Entity</h3>
            <p className="text-emerald-400 font-medium">{structured_data?.author || "Unknown Entity"}</p>
          </div>
          
          {structured_data?.threat_score !== undefined && (
            <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Threat Score</h3>
                <div className="flex items-baseline gap-1">
                  <span className={`text-3xl font-light ${scoreColor}`}>{score}</span>
                  <span className="text-slate-500 text-sm">/100</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${scoreColor}`}>{severity}</span>
            </div>
          )}
        </div>

        {/* Right Column: Network Graph Nodes */}
        <div className="col-span-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Network Graph Nodes (Extracted Domains)</h3>
          
          {structured_data?.network_nodes && structured_data.network_nodes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {structured_data.network_nodes.map((node, i) => (
                <span key={i} className="bg-slate-800/50 border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs hover:bg-slate-700 transition-colors cursor-default">
                  {node}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm italic">No network nodes detected in payload.</p>
          )}
        </div>

      </div>
    </div>
  );
}
