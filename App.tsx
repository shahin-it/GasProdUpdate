
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductionRecord, PersonnelRecord, ViewType } from './types.ts';
import { INITIAL_MOCK_DATA, INITIAL_PERSONNEL_DATA, ALLOWED_ADMIN_IPS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { dbService } from './services/dbService.ts';
import { 
  LayoutDashboard, Database, Fuel, 
  ChevronLeft, ChevronRight, 
  RefreshCw, Wifi, Moon, Sun, Monitor
} from 'lucide-react';

const CompanyLogo = () => (
  <img 
    src="logo.png" 
    alt="BGFCL Official Logo" 
    className="h-10 md:h-12 tv:h-14 w-auto block object-contain"
    style={{ display: 'block' }}
  />
);

const App: React.FC = () => {
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
  const [personnelData, setPersonnelData] = useState<PersonnelRecord[]>([]);
  const [view, setView] = useState<ViewType>('dashboard');
  const [isAdminAllowed, setIsAdminAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'mock'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  const isInitialLoad = useRef(true);
  const prevLatestDate = useRef<string | null>(null);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    productionData.forEach(r => dates.add(r.date));
    return Array.from(dates).sort();
  }, [productionData]);
  
  const latestDateInSystem = useMemo(() => 
    availableDates.length > 0 ? availableDates[availableDates.length - 1] : new Date().toISOString().split('T')[0],
    [availableDates]
  );

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    if (!dbService.isConfigured()) {
      const savedProd = localStorage.getItem('gaspro_production_data');
      const savedPers = localStorage.getItem('gaspro_personnel_data');
      setProductionData(savedProd ? JSON.parse(savedProd) : INITIAL_MOCK_DATA);
      setPersonnelData(savedPers ? JSON.parse(savedPers) : INITIAL_PERSONNEL_DATA);
      setDbStatus('mock');
      return;
    }
    try {
      const [records, personnel] = await Promise.all([
        dbService.getRecords(),
        dbService.getPersonnelRecords()
      ]);
      setProductionData(records);
      setPersonnelData(personnel);
      setDbStatus('online');
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Fetch error:", err);
      setDbStatus('offline');
    }
  };

  useEffect(() => {
    if (dbStatus !== 'online') return;

    const channel = dbService.subscribeToChanges((payload) => {
      setIsSyncing(true);
      const { type, eventType, new: newRecord, old: oldRecord } = payload;

      if (type === 'production') {
        setProductionData(prev => {
          if (eventType === 'INSERT') return [newRecord, ...prev];
          if (eventType === 'UPDATE') return prev.map(r => r.id === newRecord.id ? newRecord : r);
          if (eventType === 'DELETE') return prev.filter(r => r.id !== oldRecord.id);
          return prev;
        });
      } else if (type === 'personnel') {
        setPersonnelData(prev => {
          if (eventType === 'INSERT') return [newRecord, ...prev];
          if (eventType === 'UPDATE') return prev.map(r => r.id === newRecord.id ? newRecord : r);
          if (eventType === 'DELETE') return prev.filter(r => r.id !== oldRecord.id);
          return prev;
        });
      }

      setLastUpdated(new Date());
      setTimeout(() => setIsSyncing(false), 1500);
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [dbStatus]);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await fetchData();
      
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const result = await response.json();
        setIsAdminAllowed(ALLOWED_ADMIN_IPS.includes(result.ip) || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      } catch {
        setIsAdminAllowed(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      }
      setIsLoading(false);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading && availableDates.length > 0) {
      const systemLatest = latestDateInSystem;
      const isNewerDateAvailable = prevLatestDate.current && systemLatest > prevLatestDate.current;
      const isCurrentlySelectedValid = availableDates.includes(selectedDate);
      
      if (isInitialLoad.current || !isCurrentlySelectedValid || isNewerDateAvailable) {
        setSelectedDate(systemLatest);
        isInitialLoad.current = false;
      }
      
      prevLatestDate.current = systemLatest;
    }
  }, [availableDates, latestDateInSystem, isLoading, selectedDate]);

  useEffect(() => {
    if (dbStatus === 'mock') {
      localStorage.setItem('gaspro_production_data', JSON.stringify(productionData));
      localStorage.setItem('gaspro_personnel_data', JSON.stringify(personnelData));
      setLastUpdated(new Date());
    }
  }, [productionData, personnelData, dbStatus]);

  const handleAddProduction = async (record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') await dbService.addRecord(record);
    else setProductionData(prev => [{ ...record, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
  };

  const handleUpdateProduction = async (id: string, record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') await dbService.updateRecord(id, record);
    else setProductionData(prev => prev.map(r => r.id === id ? { ...record, id } : r));
  };

  const handleDeleteProduction = async (id: string) => {
    if (dbStatus === 'online') await dbService.deleteRecord(id);
    else setProductionData(prev => prev.filter(r => r.id !== id));
  };

  const handleAddPersonnel = async (record: Omit<PersonnelRecord, 'id'>) => {
    if (dbStatus === 'online') await dbService.addPersonnelRecord(record);
    else setPersonnelData(prev => [{ ...record, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
  };

  const handleUpdatePersonnel = async (id: string, record: Omit<PersonnelRecord, 'id'>) => {
    if (dbStatus === 'online') await dbService.updatePersonnelRecord(id, record);
    else setPersonnelData(prev => prev.map(r => r.id === id ? { ...record, id } : r));
  };

  const handleDeletePersonnel = async (id: string) => {
    if (dbStatus === 'online') await dbService.deletePersonnelRecord(id);
    else setPersonnelData(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800/80 backdrop-blur-2xl px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="bg-[#004b49] px-2 py-1 rounded-xl shadow-2xl border border-white/10">
            <CompanyLogo />
          </div>
          <div className="hidden tv:block h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div>
            <h1 className="text-xl font-black tracking-[0.1em] uppercase leading-none text-slate-900 dark:text-white">BGFCL <span className="text-emerald-500">Command</span></h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
              <RefreshCw size={10} className={`${isSyncing ? 'animate-spin' : 'animate-spin-slow'}`} /> Active Sync: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <nav className="flex items-center bg-slate-100/50 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
          <button onClick={() => setView('dashboard')} className={`px-6 py-2.5 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${view === 'dashboard' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          
          {view === 'dashboard' && (
            <div className="mx-2 flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx > 0) setSelectedDate(availableDates[idx - 1]); }} 
                disabled={availableDates.indexOf(selectedDate) <= 0} 
                className="p-1 text-slate-400 hover:text-emerald-500 disabled:opacity-20 transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              
              <div className="flex items-center px-4 text-slate-900 dark:text-white font-black text-xs border-x border-slate-100 dark:border-slate-800">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-transparent border-none focus:ring-0 outline-none p-0 w-32 cursor-pointer uppercase" 
                />
              </div>

              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]); }} 
                disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1} 
                className="p-1 text-slate-400 hover:text-emerald-500 disabled:opacity-20 transition-colors"
              >
                <ChevronRight size={22} />
              </button>
            </div>
          )}

          {isAdminAllowed && (
            <button onClick={() => setView('admin')} className={`px-6 py-2.5 rounded-xl flex items-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${view === 'admin' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xl' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}>
              <Database size={18} /> Administrator
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${dbStatus === 'online' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
             <div className={`w-2 h-2 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
             {dbStatus === 'online' ? 'Global Cloud' : 'Local Terminal'}
           </div>
           
           <button onClick={toggleTheme} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 rounded-2xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 transition-all">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           
           <div className="hidden tv:flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-slate-500">
             <Monitor size={20} />
             <span className="text-[10px] font-black uppercase tracking-tighter">TV Optimized</span>
           </div>
        </div>
      </header>

      <main className="flex-1 px-8 py-8 w-full">
        {isLoading ? (
          <div className="h-[70vh] flex flex-col items-center justify-center space-y-6 text-slate-400 dark:text-slate-600">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="font-black uppercase tracking-[0.5em] text-sm animate-pulse">Initializing Command Center Data Stream...</p>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard productionData={productionData} personnelData={personnelData} selectedDate={selectedDate} latestDateInSystem={latestDateInSystem} isDarkMode={isDark} />
        ) : (
          <AdminPanel 
            productionData={productionData} 
            personnelData={personnelData}
            onAddProduction={handleAddProduction} 
            onUpdateProduction={handleUpdateProduction}
            onDeleteProduction={handleDeleteProduction}
            onAddPersonnel={handleAddPersonnel}
            onUpdatePersonnel={handleUpdatePersonnel}
            onDeletePersonnel={handleDeletePersonnel}
          />
        )}
      </main>
    </div>
  );
};

export default App;
