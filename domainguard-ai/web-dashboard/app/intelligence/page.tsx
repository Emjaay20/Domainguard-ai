"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface Threat {
  id: string;
  url: string;
  ai_sentiment_label: string;
  structured_data: { threat_score?: number };
}

export default function IntelligenceHub() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://domainguard-ai.duckdns.org";


  useEffect(() => {
    fetch(`${API_URL}/api/threats?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        setThreats((data.data || []).reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const timelineData = threats.map((threat, index) => ({
    name: `Target ${index + 1}`,
    score: threat.structured_data?.threat_score || 0,
    url: threat.url,
    label: threat.ai_sentiment_label,
  }));

  const scoreDistribution = [
    { range: "Low (0-30)", count: threats.filter((threat) => (threat.structured_data?.threat_score || 0) <= 30).length, color: "#34d399" },
    { range: "Elevated (31-75)", count: threats.filter((threat) => (threat.structured_data?.threat_score || 0) > 30 && (threat.structured_data?.threat_score || 0) <= 75).length, color: "#fbbf24" },
    { range: "Critical (76-100)", count: threats.filter((threat) => (threat.structured_data?.threat_score || 0) > 75).length, color: "#f87171" },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-xl">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Intercepted Target</p>
          <p className="text-sm font-mono text-indigo-400 mb-3 truncate max-w-50">{data.url}</p>
          <div className="flex justify-between items-end gap-6">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Threat Score</p>
              <p className={`text-2xl font-bold ${data.score > 75 ? "text-red-400" : data.score > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                {data.score}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-bold ${data.label === "NEGATIVE" ? "bg-red-500/20 text-red-400" : data.label === "BENIGN" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {data.label}
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <main className="p-8 max-w-7xl mx-auto w-full">
      <header className="mb-8 border-b border-slate-800/50 pb-6 flex justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2 flex items-center gap-3">
            Intelligence Hub
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
          </h1>
          <p className="text-slate-400 text-sm">Real-time macro-analytics and network operations telemetry.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-6 py-3 text-center shadow-inner">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Intercepts</p>
            <p className="text-2xl font-light text-white">{threats.length}</p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-6 py-3 text-center shadow-inner">
            <p className="text-[10px] font-bold text-red-500/70 uppercase tracking-widest mb-1">Critical Threats</p>
            <p className="text-2xl font-bold text-red-400">
              {threats.filter((threat) => (threat.structured_data?.threat_score || 0) > 75).length}
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="animate-pulse h-96 bg-slate-800/50 rounded-xl w-full"></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Threat Velocity (Live Stream)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} hide />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#4f46e5", strokeWidth: 1, strokeDasharray: "4 4" }} />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#818cf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    activeDot={{ r: 6, fill: "#818cf8", stroke: "#1e293b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-1 bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Severity Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="range" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    cursor={{ fill: "#1e293b" }}
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
