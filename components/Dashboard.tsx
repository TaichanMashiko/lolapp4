import React, { useEffect, useState } from 'react';
import { fetchMatchHistory } from '../services/sheetsService';
import { MatchRecord, ROLE_TRANSLATIONS } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, Trophy } from 'lucide-react';

interface Props {
  spreadsheetId: string;
}

const Dashboard: React.FC<Props> = ({ spreadsheetId }) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (spreadsheetId) {
      loadData();
    }
  }, [spreadsheetId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchMatchHistory(spreadsheetId);
      setMatches(data);
    } catch (error) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const processCorrelation = () => {
    const buckets = {
      '0-25%': { wins: 0, total: 0 },
      '26-50%': { wins: 0, total: 0 },
      '51-75%': { wins: 0, total: 0 },
      '76-100%': { wins: 0, total: 0 },
    };

    matches.forEach(m => {
      let key = '0-25%';
      if (m.achievement_rate > 75) key = '76-100%';
      else if (m.achievement_rate > 50) key = '51-75%';
      else if (m.achievement_rate > 25) key = '26-50%';

      buckets[key as keyof typeof buckets].total++;
      if (m.result === 'Win') buckets[key as keyof typeof buckets].wins++;
    });

    return Object.keys(buckets).map(k => {
      const b = buckets[k as keyof typeof buckets];
      return {
        range: k,
        winRate: b.total > 0 ? (b.wins / b.total) * 100 : 0,
        games: b.total
      };
    });
  };

  const correlationData = processCorrelation();
  
  const lineData = matches.slice(-20).map((m, i) => ({
    game: i + 1,
    rate: m.achievement_rate,
    result: m.result
  }));

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">総試合数</h3>
          <p className="text-4xl font-bold text-white">{matches.length}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">全体勝率</h3>
          <p className="text-4xl font-bold text-cyan-400">
            {matches.length > 0 
              ? ((matches.filter(m => m.result === 'Win').length / matches.length) * 100).toFixed(1) 
              : 0}%
          </p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">平均マインドセットスコア</h3>
          <p className="text-4xl font-bold text-purple-400">
             {matches.length > 0 
              ? (matches.reduce((acc, m) => acc + m.achievement_rate, 0) / matches.length).toFixed(1) 
              : 0}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mindset Trend */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-cyan-500" /> マインドセットの推移 (直近20戦)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="game" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#06b6d4" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> 意識レベル別の勝率
          </h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={correlationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" unit="%" />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                />
                <Bar dataKey="winRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-slate-500 mt-2">アドバイスを意識することで勝率は上がるのか？</p>
        </div>

      </div>

      {/* Recent History Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
            <h3 className="text-lg font-bold text-white">直近の試合</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-3">結果</th>
                <th className="px-6 py-3">チャンプ</th>
                <th className="px-6 py-3">ロール</th>
                <th className="px-6 py-3">達成率</th>
                <th className="px-6 py-3">日付</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {matches.slice().reverse().slice(0, 5).map((m, i) => (
                <tr key={i} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4">
                    <span className={`font-bold ${m.result === 'Win' ? 'text-blue-400' : 'text-red-400'}`}>
                      {m.result === 'Win' ? '勝利' : '敗北'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">{m.champion}</td>
                  <td className="px-6 py-4">{ROLE_TRANSLATIONS[m.role] || m.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${m.achievement_rate >= 80 ? 'bg-green-500' : m.achievement_rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${m.achievement_rate}%` }}
                        ></div>
                      </div>
                      <span>{m.achievement_rate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(m.timestamp).toLocaleDateString('ja-JP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;