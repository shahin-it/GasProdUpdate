
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductionRecord, PersonnelRecord, ViewType } from './types.ts';
import { INITIAL_MOCK_DATA, INITIAL_PERSONNEL_DATA, ALLOWED_ADMIN_IPS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { dbService } from './services/dbService.ts';
import { 
  Monitor, Settings, LayoutDashboard, Database, Fuel, 
  Lock, ChevronLeft, ChevronRight, 
  Calendar, Server, AlertTriangle, Clock, RefreshCw, Wifi, Moon, Sun
} from 'lucide-react';

const CompanyLogo = () => (
  <img 
    src="logo.png" 
    alt="BGFCL Official Logo" 
    className="h-8 md:h-14 w-auto block object-contain"
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
      if (isInitialLoad.current || !availableDates.includes(selectedDate)) {
        setSelectedDate(latestDateInSystem);
        isInitialLoad.current = false;
      }
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
    if (dbStatus === 'online') {
      await dbService.addRecord(record);
    } else {
      setProductionData(prev => [{ ...record, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
    }
  };

  const handleUpdateProduction = async (id: string, record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') {
      await dbService.updateRecord(id, record);
    } else {
      setProductionData(prev => prev.map(r => r.id === id ? { ...record, id } : r));
    }
  };

  const handleDeleteProduction = async (id: string) => {
    if (dbStatus === 'online') {
      await dbService.deleteRecord(id);
    } else {
      setProductionData(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAddPersonnel = async (record: Omit<PersonnelRecord, 'id'>) => {
    if (dbStatus === 'online') {
      await dbService.addPersonnelRecord(record);
    } else {
      setPersonnelData(prev => [{ ...record, id: Math.random().toString(36).substr(2, 9) }, ...prev]);
    }
  };

  const handleUpdatePersonnel = async (id: string, record: Omit<PersonnelRecord, 'id'>) => {
    if (dbStatus === 'online') {
      await dbService.updatePersonnelRecord(id, record);
    } else {
      setPersonnelData(prev => prev.map(r => r.id === id ? { ...record, id } : r));
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    if (dbStatus === 'online') {
      await dbService.deletePersonnelRecord(id);
    } else {
      setPersonnelData(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm dark:shadow-2xl">
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-[#004b49] p-0 rounded-lg md:rounded-xl shadow-lg border border-[#003a38] overflow-hidden flex items-center justify-center">
              <CompanyLogo />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-black tracking-tight uppercase leading-none text-slate-900 dark:text-white">BGFCL GasPro <span className="text-emerald-500">Analytics</span></h1>
              <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest mt-0.5 md:mt-1 flex items-center gap-1">
                <RefreshCw size={8} className={`${isSyncing ? 'animate-spin' : 'animate-spin-slow'}`} /> Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="sm:hidden flex items-center gap-2">
             <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
        </div>

        <nav className="flex items-center bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-inner w-full sm:w-auto justify-center overflow-x-auto">
          <button onClick={() => setView('dashboard')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl flex items-center gap-2 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${view === 'dashboard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutDashboard size={16} /> Dashboard
          </button>
          
          {view === 'dashboard' && (
            <div className="mx-1 md:mx-2 flex items-center gap-1 bg-white/50 dark:bg-slate-800/80 px-1 md:px-2 py-0.5 md:py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx > 0) setSelectedDate(availableDates[idx - 1]); }} 
                disabled={availableDates.indexOf(selectedDate) <= 0} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-10"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1 md:gap-2 px-1 md:px-3 text-slate-700 dark:text-white font-black text-[10px] md:text-sm border-x border-slate-200 dark:border-slate-700 group">
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-transparent border-none focus:ring-0 outline-none p-0 w-24 md:w-32 cursor-pointer dark:color-scheme-dark" 
                />
              </div>

              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]); }} 
                disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-10"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {isAdminAllowed && (
            <button onClick={() => setView('admin')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl flex items-center gap-2 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${view === 'admin' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <Database size={16} /> Admin
            </button>
          )}
        </nav>

        <div className="hidden sm:flex items-center gap-2 md:gap-4">
           {dbStatus === 'online' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase whitespace-nowrap">
                <Wifi size={10} className="animate-pulse" /> Live
              </div>
           ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-full border border-amber-500/20 text-[10px] font-black uppercase whitespace-nowrap"><AlertTriangle size={10} /> Local</div>
           )}
           <button onClick={toggleTheme} className="p-2 md:p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg md:rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50 transition-colors">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <button className="hidden md:block p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50"><Settings size={20} /></button>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-[2000px] mx-auto w-full">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-400 dark:text-slate-500">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-xs md:text-sm animate-pulse">Initializing Data Stream...</p>
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
