
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductionRecord, PersonnelRecord, ViewType } from './types.ts';
import { INITIAL_MOCK_DATA, INITIAL_PERSONNEL_DATA, ALLOWED_ADMIN_IPS } from './constants.ts';
import Dashboard from './components/Dashboard.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import { dbService } from './services/dbService.ts';
import { 
  Monitor, Settings, LayoutDashboard, Database, Fuel, 
  Lock, ChevronLeft, ChevronRight, 
  Calendar, Server, AlertTriangle, Clock, RefreshCw, Wifi
} from 'lucide-react';

const App: React.FC = () => {
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
  const [personnelData, setPersonnelData] = useState<PersonnelRecord[]>([]);
  const [view, setView] = useState<ViewType>('dashboard');
  const [isAdminAllowed, setIsAdminAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'mock'>('mock');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitialLoad = useRef(true);

  // Derived unique sorted dates from both datasets
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

  // Setup Real-time Subscriptions
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
      // Reset syncing animation after a brief moment
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

  // Handlers
  const handleAddProduction = async (record: Omit<ProductionRecord, 'id'>) => {
    if (dbStatus === 'online') {
      await dbService.addRecord(record);
      // State is handled by real-time subscription
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
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
      <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-900/30"><Fuel className="text-white" size={28} /></div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight text-white uppercase leading-none">GasPro <span className="text-emerald-500">Analytics</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${isSyncing ? 'text-emerald-400' : 'text-slate-500'}`}>
                {dbStatus === 'online' ? 'Supabase Cloud' : 'Offline Mode'}
              </p>
              <div className={`w-1 h-1 rounded-full transition-colors duration-500 ${isSyncing ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'}`}></div>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <RefreshCw size={10} className={`${isSyncing ? 'animate-spin' : 'animate-spin-slow'}`} /> Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex items-center bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 shadow-inner">
          <button onClick={() => setView('dashboard')} className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'dashboard' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            <LayoutDashboard size={18} /> <span className="hidden md:inline">Dashboard</span>
          </button>
          
          {view === 'dashboard' && (
            <div className="mx-2 flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx > 0) setSelectedDate(availableDates[idx - 1]); }} 
                disabled={availableDates.indexOf(selectedDate) <= 0} 
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-10 transition-colors"
                title="Previous Available Date"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-2 px-3 text-white font-black text-sm border-x border-slate-700 group">
                <Calendar size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  className="bg-transparent border-none focus:ring-0 outline-none p-0 w-32 cursor-pointer" 
                />
                {selectedDate === latestDateInSystem && (
                  <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">LATEST</span>
                )}
              </div>

              <button 
                onClick={() => { const idx = availableDates.indexOf(selectedDate); if (idx < availableDates.length - 1) setSelectedDate(availableDates[idx + 1]); }} 
                disabled={availableDates.indexOf(selectedDate) >= availableDates.length - 1} 
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-10 transition-colors"
                title="Next Available Date"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {isAdminAllowed && (
            <button onClick={() => setView('admin')} className={`px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all ${view === 'admin' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
              <Database size={18} /> <span className="hidden md:inline">Admin</span>
            </button>
          )}
        </nav>
        <div className="hidden lg:flex items-center gap-4">
           {dbStatus === 'online' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase">
                <Wifi size={10} className="animate-pulse" /> Live Syncing
              </div>
           ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 text-[10px] font-black uppercase"><AlertTriangle size={10} /> Local Cache</div>
           )}
           <button className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 border border-slate-700/50 transition-colors"><Settings size={20} /></button>
        </div>
      </header>
      <main className="flex-1 px-8 py-8 max-w-[2000px] mx-auto w-full">
        {isLoading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-500">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold uppercase tracking-[0.3em] text-sm animate-pulse">Initializing Data Stream...</p>
          </div>
        ) : view === 'dashboard' ? (
          <Dashboard productionData={productionData} personnelData={personnelData} selectedDate={selectedDate} latestDateInSystem={latestDateInSystem} />
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
