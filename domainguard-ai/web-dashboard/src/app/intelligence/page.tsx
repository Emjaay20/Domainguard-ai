"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Threat {
  id: string;
  ai_sentiment_label: string;
  structured_data: { threat_score?: number };
}

export default function IntelligenceHub() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://domainguard-ai.duckdns.org";


  useEffect(() => {
    fetch(`${API_URL}/api/threats?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        setThreats(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sentimentData = [
    { name: "BENIGN", value: threats.filter(t => t.ai_sentiment_label === "BENIGN").length, color: "#34d399" },
    { name: "NEUTRAL", value: threats.filter(t => t.ai_sentiment_label === "NEUTRAL").length, color: "#fbbf24" },
    { name: "NEGATIVE", value: threats.filter(t => t.ai_sentiment_label === "NEGATIVE").length, color: "#f87171" },
  ];

  const scoreDistribution = [
    { range: "Low (0-30)", count: threats.filter(t => (t.structured_data?.threat_score || 0) <= 30).length },
    { range: "Elevated (31-75)", count: threats.filter(t => (t.structured_data?.threat_score || 0) > 30 && (t.structured_data?.threat_score || 0) <= 75).length },
    { range: "Critical (76-100)", count: threats.filter(t => (t.structured_data?.threat_score || 0) > 75).length },
  ];

  return (
    <main className="p-8 max-w-6xl mx-auto w-full">
      <header className="mb-8 border-b border-slate-800/50 pb-6">
        <h1 className="text-4xl font-serif font-bold text-white tracking-tight mb-2">Intelligence Hub</h1>
        <p className="text-slate-400 text-sm">Macro-level analytics and threat distribution metrics.</p>
      </header>

      {loading ? (
        <div className="animate-pulse h-64 bg-slate-800/50 rounded-xl w-full"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Global Sentiment Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} itemStyle={{ color: '#f8fafc' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-400 font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Threat Severity Metrics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <XAxis dataKey="range" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </main>
  );
}
