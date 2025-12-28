
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductionRecord, ViewType } from './types';
import { INITIAL_MOCK_DATA, ALLOWED_ADMIN_IPS } from './constants';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { dbService } from './services/dbService';
import { 
  Monitor, Settings, LayoutDashboard, Database, Fuel, 
  ShieldCheck, ShieldAlert, Lock, ChevronLeft, ChevronRight, 
  Calendar, RefreshCw, Server, AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<ProductionRecord[]>([]);
  const [view, setView] = useState<ViewType>('dashboard');
  const [isAdminAllowed, setIsAdminAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'mock'>('mock');
  const isInitialLoad = useRef(true);

  // Derived date info
  const availableDates = useMemo(() => 
    Array.from(new Set<string>(data.map(r => r.date))).sort(), 
    [data]
  );
  
  const latestDateInSystem = useMemo(() => 
    availableDates.length > 0 ? availableDates[availableDates.length - 1] : new Date().toISOString().split('T')[0],
    [availableDates]
  );

  const [selectedDate, setSelectedDate] = useState<string>(latestDateInSystem);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      if (!dbService.isConfigured()) {
        console.info("Supabase not configured. Loading mock data.");
        const saved = localStorage.getItem('gaspro_production_data');
        setData(saved ? JSON.parse(saved) : INITIAL_MOCK_DATA);
        setDbStatus('mock');
        setIsLoading(false);
        return;
      }

      try {
        const records = await dbService.getRecords();
        if (records && records.length > 0) {
          setData(records);
          setDbStatus('online');
        } else {
          // If DB is connected but empty, offer mock data as starting point
          const saved = localStorage.getItem('gaspro_production_data');
          setData(saved ? JSON.parse(saved) : INITIAL_MOCK_DATA);
          setDbStatus('online'); // It's online, just empty (or using local cache)
        }
      } catch (err) {
        console.error("DB Connection failed:", err);
        setDbStatus('offline');
        const saved = localStorage.getItem('gaspro_production_data');
        setData(saved ? JSON.parse(saved) : INITIAL_MOCK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    const checkIpAccess = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const result = await response.json();
        const currentIp = result.ip;
        
        const isAllowed = ALLOWED_ADMIN_IPS.includes(currentIp) || 
                          window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
        
        setIsAdminAllowed(isAllowed);
      } catch (error) {
        // Fallback for dev environments
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            setIsAdminAllowed(true);
        } else {
            setIsAdminAllowed(false);
        }
      }
    };

    initializeData();
    checkIpAccess();
  }, []);

  // Robust default-to-latest logic
  useEffect(() => {
    if (availableDates.length > 0) {
      if (isInitialLoad.current || !availableDates.includes(selectedDate)) {
        setSelectedDate(latestDateInSystem);
        isInitialLoad.current = false;
      }
    }
  }, [availableDates, latestDateInSystem, selectedDate]);

  // Persistence for mock mode
  useEffect(() => {
    if (dbStatus === 'mock' && data.length > 0) {
      localStorage.setItem('gaspro_production_data', JSON.stringify(data));
    }
  }, [data, dbStatus]);

  const handleAddRecord = async (record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') {
      const newRecord = await dbService.addRecord(record);
      if (newRecord) {
        setData(prev => [newRecord, ...prev]);
        return;
      }
    }
    
    // Fallback/Mock mode
    const mockRecord = { ...record, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => [mockRecord, ...prev]);
  };

  const handleUpdateRecord = async (id: string, record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') {
      const updatedRecord = await dbService.updateRecord(id, record);
      if (updatedRecord) {
        setData(prev => prev.map(r => r.id === id ? updatedRecord : r));
        return;
      }
    }
    
    // Fallback/Mock mode
    setData(prev => prev.map(r => r.id === id ? { ...record, id } : r));
  };

  const handleDeleteRecord = async (id: string) => {
    if (dbStatus === 'online') {
      const success = await dbService.deleteRecord(id);
      if (success) {
        setData(prev => prev.filter(r => r.id !== id));
        return;
      }
    }
    
    // Fallback/Mock mode
    setData(prev => prev.filter(r => r.id !== id));
  };

  const handlePrevDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx > 0) setSelectedDate(availableDates[idx - 1]);
  };

  const handleNextDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-900/30">
            <Fuel className="text-white" size={28} />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight text-white uppercase leading-none">GasPro <span className="text-emerald-500">Analytics</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {dbStatus === 'online' ? 'Cloud SQL Synchronized' : 'Local Sandbox Mode'}
            </p>
          </div>
        </div>

        <nav className="flex items-center bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 shadow-inner">
          <button 
            onClick={() => setView('dashboard')}
            className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'dashboard' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <LayoutDashboard size={18} /> <span className="hidden md:inline">Dashboard</span>
          </button>
          
          {view === 'dashboard' && (
            <div className="mx-2 flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
              <button 
                onClick={handlePrevDay}
                disabled={availableDates.indexOf(selectedDate) <= 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-10 transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-2 px-2 text-white font-black text-sm border-x border-slate-700">
                <Calendar size={14} className="text-emerald-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 outline-none text-center cursor-pointer p-0 w-32"
                />
              </div>

              <button 
                onClick={handleNextDay}
                disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-10 transition-colors"
                aria-label="Next day"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {isAdminAllowed && (
            <button 
              onClick={() => setView('admin')}
              className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'admin' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Database size={18} /> <span className="hidden md:inline">Admin</span>
            </button>
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-tighter">Server Status</span>
              {dbStatus === 'online' ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                  <Server size={10} />
                  <span className="text-[10px] font-black">PostgreSQL LIVE</span>
                </div>
              ) : dbStatus === 'mock' ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  <Database size={10} />
                  <span className="text-[10px] font-black uppercase">Demo Data</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
                  <AlertTriangle size={10} />
                  <span className="text-[10px] font-black uppercase">Offline</span>
                </div>
              )}
            </div>
          </div>
          <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors border border-slate-700/50">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 px-8 py-8 max-w-[2000px] mx-auto w-full">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Initializing Interface...</p>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard data={data} selectedDate={selectedDate} latestDateInSystem={latestDateInSystem} />
        ) : isAdminAllowed ? (
          <AdminPanel 
            data={data} 
            onAdd={handleAddRecord} 
            onUpdate={handleUpdateRecord}
            onDelete={handleDeleteRecord} 
          />
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="p-8 bg-slate-800/50 rounded-full border border-slate-700/50 shadow-2xl">
              <Lock size={120} className="text-slate-600" />
            </div>
            <div className="max-w-md">
              <h2 className="text-3xl font-black text-white mb-4">RESTRICTED AREA</h2>
              <p className="text-slate-400 font-medium">
                Authorization failed. Please access from the corporate network or contact IT.
              </p>
              <button 
                onClick={() => setView('dashboard')}
                className="mt-8 px-10 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 p-6 flex justify-between items-center text-slate-500 text-xs font-medium">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Monitor size={14} /> TV Optimization v3.5
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'mock' ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'}`}></div>
            {dbStatus === 'online' ? 'PostgreSQL Connected' : dbStatus === 'mock' ? 'Mock Mode (LocalStorage)' : 'Connection Interrupted'}
          </div>
        </div>
        <div>
          &copy; {new Date().getFullYear()} Gas Production Ltd. Cloud Intelligence Suite.
        </div>
      </footer>
    </div>
  );
};

export default App;
