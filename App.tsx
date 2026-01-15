import React, { useState, useEffect } from 'react';
import { initializeGoogleApi, handleLogin, checkAuth } from './services/sheetsService';
import VideoAnalyzer from './components/VideoAnalyzer';
import MatchReview from './components/MatchReview';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, PlayCircle, ClipboardList, Settings, Key, LogIn } from 'lucide-react';

// You would typically move this to a constants file or env vars
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE"; // Placeholder, user needs to fill
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY_HERE"; // Placeholder, for GAPI (optional if using token)
const GEMINI_API_KEY_DEFAULT = process.env.API_KEY || ""; 

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analyze' | 'review' | 'settings'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Settings State
  const [geminiKey, setGeminiKey] = useState(GEMINI_API_KEY_DEFAULT);
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [clientId, setClientId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load config from local storage if available
    const savedSheetId = localStorage.getItem('lol_tracker_sheet_id');
    const savedClientId = localStorage.getItem('lol_tracker_client_id');
    const savedGeminiKey = localStorage.getItem('lol_tracker_gemini_key');

    if (savedSheetId) setSpreadsheetId(savedSheetId);
    if (savedClientId) setClientId(savedClientId);
    if (savedGeminiKey) setGeminiKey(savedGeminiKey);
  }, []);

  const initAuth = async () => {
    if (!clientId) {
      alert("Please provide a Google Client ID in Settings first.");
      setActiveTab('settings');
      return;
    }
    
    try {
      await initializeGoogleApi(clientId, ""); // GAPI Key not strictly needed if we rely on OAuth token
      const authed = checkAuth();
      setIsLoggedIn(authed);
      setIsConfigured(true);
    } catch (e) {
      console.error("Auth init failed", e);
    }
  };

  const login = async () => {
    try {
      await handleLogin();
      setIsLoggedIn(true);
    } catch (e) {
      alert("Login failed. Check console.");
    }
  };

  const saveSettings = () => {
    localStorage.setItem('lol_tracker_sheet_id', spreadsheetId);
    localStorage.setItem('lol_tracker_client_id', clientId);
    localStorage.setItem('lol_tracker_gemini_key', geminiKey);
    alert("Settings saved. Please refresh if you changed Client ID.");
    initAuth();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          LoL Mindset
        </h1>
        <button onClick={() => setActiveTab('settings')} className="text-slate-400">
          <Settings />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
            LoL MINDSET
            <span className="block text-xs text-slate-500 font-medium tracking-widest mt-1">TRACKER</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
          />
          <NavButton 
            active={activeTab === 'analyze'} 
            onClick={() => setActiveTab('analyze')} 
            icon={<PlayCircle />} 
            label="Video Analyzer" 
          />
          <NavButton 
            active={activeTab === 'review'} 
            onClick={() => setActiveTab('review')} 
            icon={<ClipboardList />} 
            label="Match Review" 
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings />} 
            label="Settings" 
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {!isLoggedIn && activeTab !== 'settings' ? (
          <div className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full text-center">
              <Key className="w-12 h-12 text-cyan-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
              <p className="text-slate-400 mb-6">Connect your Google Account to access your Knowledge Base and Match History stored in Google Sheets.</p>
              
              {!isConfigured ? (
                 <button 
                 onClick={() => setActiveTab('settings')}
                 className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-colors"
               >
                 Go to Settings
               </button>
              ) : (
                <button 
                  onClick={login}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-5 h-5" /> Sign in with Google
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard spreadsheetId={spreadsheetId} />}
            {activeTab === 'analyze' && <VideoAnalyzer apiKey={geminiKey} spreadsheetId={spreadsheetId} />}
            {activeTab === 'review' && <MatchReview spreadsheetId={spreadsheetId} />}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-slate-800 p-8 rounded-xl border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Application Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Google Client ID (OAuth)</label>
                <input 
                  type="text" 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="xxxx.apps.googleusercontent.com"
                />
                <p className="text-xs text-slate-500 mt-1">From Google Cloud Console. Must allow 'https://apis.google.com/js/api.js' origin.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                />
                 <p className="text-xs text-slate-500 mt-1">Paid key required for Search Grounding (Gemini 3 Pro).</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Google Spreadsheet ID</label>
                <input 
                  type="text" 
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  placeholder="The long ID in the sheet URL"
                />
                <p className="text-xs text-slate-500 mt-1">Sheet must contain 'Knowledge_Base' and 'Match_History' tabs.</p>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={saveSettings}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Save Configuration
                </button>
                {clientId && (
                   <button 
                   onClick={initAuth}
                   className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-lg"
                 >
                   Initialize Auth
                 </button>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden bg-slate-950 border-t border-slate-800 p-2 flex justify-around sticky bottom-0 z-50">
         <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded ${activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-500'}`}><LayoutDashboard /></button>
         <button onClick={() => setActiveTab('analyze')} className={`p-2 rounded ${activeTab === 'analyze' ? 'text-cyan-400' : 'text-slate-500'}`}><PlayCircle /></button>
         <button onClick={() => setActiveTab('review')} className={`p-2 rounded ${activeTab === 'review' ? 'text-cyan-400' : 'text-slate-500'}`}><ClipboardList /></button>
      </nav>

      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 shadow-[0_0_15px_rgba(8,145,178,0.2)]' 
        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
    }`}
  >
    {React.cloneElement(icon, { size: 20 })}
    <span className="font-semibold">{label}</span>
  </button>
);

export default App;