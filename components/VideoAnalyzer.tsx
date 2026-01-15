import React, { useState } from 'react';
import { extractAdviceFromVideo } from '../services/geminiService';
import { appendAdvice } from '../services/sheetsService';
import { Advice } from '../types';
import { Loader2, Youtube, Save, CheckCircle } from 'lucide-react';
import { CATEGORY_TRANSLATIONS, IMPORTANCE_TRANSLATIONS } from '../types';

interface Props {
  apiKey: string;
  spreadsheetId: string;
}

const VideoAnalyzer: React.FC<Props> = ({ apiKey, spreadsheetId }) => {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedAdvice, setExtractedAdvice] = useState<Partial<Advice>[]>([]);
  const [videoTitle, setVideoTitle] = useState('解析結果');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setExtractedAdvice([]);
    setSuccessMsg('');

    try {
      const results = await extractAdviceFromVideo(apiKey, url, notes);
      setExtractedAdvice(results);
      setVideoTitle(`動画解析 - ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      alert("動画の解析に失敗しました。APIキーが有効か、モデルが利用可能かを確認してください。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!spreadsheetId) {
      alert("設定画面でスプレッドシートIDを設定してください。");
      return;
    }
    setIsSaving(true);
    try {
      const fullAdvice: Advice[] = extractedAdvice.map(item => ({
        timestamp: new Date().toISOString(),
        video_title: videoTitle,
        video_url: url,
        content: item.content || '',
        role_tags: item.role_tags || 'General',
        champion_tags: item.champion_tags || 'General',
        category: (item.category as any) || 'Macro',
        importance: (item.importance as any) || 'Medium'
      }));

      await appendAdvice(spreadsheetId, fullAdvice);
      setSuccessMsg('ナレッジベースに保存しました！');
      setExtractedAdvice([]);
      setUrl('');
      setNotes('');
    } catch (error) {
      alert("スプレッドシートへの保存に失敗しました。権限を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Youtube className="w-6 h-6" />
          知識の抽出
        </h2>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">YouTube URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">コンテキスト / メモ (任意)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例: ミッドレーンのウェーブ管理について重点的に"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white h-24"
            />
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Geminiで解析中...
              </>
            ) : (
              '動画を解析'
            )}
          </button>
        </form>
      </div>

      {extractedAdvice.length > 0 && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-4">抽出されたアドバイス ({extractedAdvice.length}件)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">内容</th>
                  <th className="px-4 py-3">ロール</th>
                  <th className="px-4 py-3">カテゴリ</th>
                  <th className="px-4 py-3">重要度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {extractedAdvice.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-white">{item.content}</td>
                    <td className="px-4 py-3">{item.role_tags}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${item.category === 'Mental' ? 'bg-purple-900 text-purple-200' : 
                          item.category === 'Laning' ? 'bg-red-900 text-red-200' : 'bg-blue-900 text-blue-200'}`}>
                        {CATEGORY_TRANSLATIONS[item.category as string] || item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase">
                        {IMPORTANCE_TRANSLATIONS[item.importance as string] || item.importance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              データベースに保存
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-900/50 border border-green-500 text-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzer;