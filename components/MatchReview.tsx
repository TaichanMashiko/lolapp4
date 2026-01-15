import React, { useState } from 'react';
import { fetchKnowledgeBase, appendMatchRecord } from '../services/sheetsService';
import { Advice, Role, ROLES_LIST, ROLE_TRANSLATIONS, CATEGORY_TRANSLATIONS, IMPORTANCE_TRANSLATIONS } from '../types';
import { Sword, CheckSquare, ChevronRight, Save, Loader2 } from 'lucide-react';

interface Props {
  spreadsheetId: string;
}

const MatchReview: React.FC<Props> = ({ spreadsheetId }) => {
  const [step, setStep] = useState(1);
  const [isLoadingKB, setIsLoadingKB] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step 1 State
  const [selectedRole, setSelectedRole] = useState<Role>(Role.MID);
  const [champion, setChampion] = useState('');
  const [result, setResult] = useState<'Win' | 'Loss'>('Win');

  // Step 2 State
  const [relevantAdvice, setRelevantAdvice] = useState<Advice[]>([]);
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('');

  const handleNext = async () => {
    if (!champion) {
      alert("チャンピオン名を入力してください。");
      return;
    }
    if (!spreadsheetId) {
      alert("スプレッドシートIDを設定してください。");
      return;
    }

    setIsLoadingKB(true);
    try {
      const allAdvice = await fetchKnowledgeBase(spreadsheetId);
      
      // Filter Logic
      const filtered = allAdvice.filter(advice => {
        const roles = advice.role_tags.toLowerCase();
        const champs = advice.champion_tags.toLowerCase();
        
        const roleMatch = roles.includes('general') || roles.includes(selectedRole.toLowerCase());
        const champMatch = champs.includes('general') || champs.includes(champion.toLowerCase());

        return roleMatch && champMatch;
      });

      setRelevantAdvice(filtered);
      setStep(2);
    } catch (error) {
      alert("ナレッジベースの読み込みに失敗しました。");
    } finally {
      setIsLoadingKB(false);
    }
  };

  const toggleCheck = (idx: number) => {
    const next = new Set(checkedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCheckedIndices(next);
  };

  const handleFinish = async () => {
    setIsSaving(true);
    const checkedCount = checkedIndices.size;
    const totalCount = relevantAdvice.length;
    const rate = totalCount === 0 ? 0 : (checkedCount / totalCount) * 100;

    try {
      await appendMatchRecord(spreadsheetId, {
        timestamp: new Date().toISOString(),
        role: selectedRole,
        champion: champion,
        result: result,
        achievement_rate: parseFloat(rate.toFixed(1)),
        checked_count: checkedCount,
        total_count: totalCount,
        note: note
      });
      alert(`試合記録を保存しました！ 達成率: ${rate.toFixed(1)}%`);
      // Reset
      setStep(1);
      setChampion('');
      setCheckedIndices(new Set());
      setNote('');
    } catch (error) {
      alert("試合記録の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl animate-in slide-in-from-bottom-4">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Sword className="w-6 h-6 text-yellow-500" /> 試合設定
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-slate-400 mb-2 font-medium">ロール</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ROLES_LIST.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  className={`py-2 px-1 rounded-lg text-sm font-bold transition-all border ${
                    selectedRole === r 
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)]' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {ROLE_TRANSLATIONS[r]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-2 font-medium">チャンピオン</label>
            <input
              type="text"
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              placeholder="例: Ahri"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-2 font-medium">結果</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setResult('Win')}
                className={`py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                  result === 'Win' 
                    ? 'bg-blue-900/50 border-blue-500 text-blue-200' 
                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-blue-800'
                }`}
              >
                勝利 (WIN)
              </button>
              <button
                onClick={() => setResult('Loss')}
                className={`py-4 rounded-xl border-2 font-bold text-lg transition-all ${
                  result === 'Loss' 
                    ? 'bg-red-900/50 border-red-500 text-red-200' 
                    : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-red-800'
                }`}
              >
                敗北 (LOSS)
              </button>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={isLoadingKB}
            className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            {isLoadingKB ? <Loader2 className="animate-spin" /> : <>振り返りを開始 <ChevronRight /></>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-green-400" /> マインドセット・チェックリスト
        </h2>
        <div className="text-sm text-slate-400">
          <span className="text-white font-bold">{ROLE_TRANSLATIONS[selectedRole]}</span> で <span className="text-white font-bold">{champion}</span> を使用中
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {relevantAdvice.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            このロールとチャンピオンの組み合わせに対するアドバイスがまだナレッジベースにありません。
            <br />
            <span className="text-xs text-slate-500">「動画解析」タブからアドバイスを追加してください！</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {relevantAdvice.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => toggleCheck(idx)}
                className={`p-4 cursor-pointer transition-colors flex items-start gap-4 hover:bg-slate-700/30 ${checkedIndices.has(idx) ? 'bg-green-900/10' : ''}`}
              >
                <div className={`mt-1 w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  checkedIndices.has(idx) ? 'bg-green-500 border-green-500 text-black' : 'border-slate-500'
                }`}>
                  {checkedIndices.has(idx) && <CheckSquare className="w-4 h-4" />}
                </div>
                <div>
                  <p className={`text-lg ${checkedIndices.has(idx) ? 'text-green-300' : 'text-slate-200'}`}>
                    {item.content}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        {CATEGORY_TRANSLATIONS[item.category] || item.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                        重要度: {IMPORTANCE_TRANSLATIONS[item.importance] || item.importance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <label className="block text-slate-400 mb-2 font-medium">試合後のメモ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="良かった点、悪かった点などを記録..."
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white h-20"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setStep(1)}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg"
        >
          戻る
        </button>
        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : <><Save /> 戦績を保存</>}
        </button>
      </div>
    </div>
  );
};

export default MatchReview;