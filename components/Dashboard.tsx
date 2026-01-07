
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord, PersonnelRecord } from '../types.ts';
import { ORGANOGRAM } from '../constants.ts';
import { FieldDistributionChart, HistoricalTrendChart, FieldComparisonBar } from './Charts.tsx';
import ProductionTable from './ProductionTable.tsx';
import { getAIInsights } from '../services/geminiService.ts';
import { Sparkles, TrendingUp, Activity, Clock, LayoutList, History, Zap, Users, Briefcase, Droplets, FlaskConical, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  productionData: ProductionRecord[];
  personnelData: PersonnelRecord[];
  selectedDate: string;
  latestDateInSystem: string;
  isDarkMode: boolean;
}

const Dashboard: React.FC<Props> = ({ productionData, personnelData, selectedDate, latestDateInSystem, isDarkMode }) => {
  const [insights, setInsights] = useState<string>('Analyzing operational metrics...');
  const [loadingInsights, setLoadingInsights] = useState(true);

  const dayRecords = useMemo(() => productionData.filter(d => d.date === selectedDate), [productionData, selectedDate]);
  
  const latestPersonnel = useMemo(() => {
    if (!personnelData.length) return null;
    return [...personnelData].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [personnelData]);

  const stats = useMemo(() => {
    const officers = latestPersonnel?.officers || 0;
    const employees = latestPersonnel?.employees || 0;
    const total = officers + employees;
    
    // Use values from DB if available, otherwise fall back to global constants
    const targetOfficers = latestPersonnel?.approved_officers || ORGANOGRAM.OFFICERS;
    const targetEmployees = latestPersonnel?.approved_employees || ORGANOGRAM.EMPLOYEES;
    const targetTotal = targetOfficers + targetEmployees;
    
    return {
      officers,
      employees,
      total,
      targetOfficers,
      targetEmployees,
      targetTotal,
      offDiff: officers - targetOfficers,
      empDiff: employees - targetEmployees,
      totalDiff: total - targetTotal,
      offPercent: (officers / targetOfficers) * 100,
      empPercent: (employees / targetEmployees) * 100
    };
  }, [latestPersonnel]);
  
  const totalProduction = useMemo(() => dayRecords.reduce((acc, curr) => acc + curr.amount, 0), [dayRecords]);
  const totalCondensate = useMemo(() => dayRecords.reduce((acc, curr) => acc + (curr.condensate || 0), 0), [dayRecords]);
  const totalWater = useMemo(() => dayRecords.reduce((acc, curr) => acc + (curr.water || 0), 0), [dayRecords]);

  const isLatest = selectedDate === latestDateInSystem;

  const historicalMetrics = useMemo(() => {
    const dailyTotalsMap: Record<string, number> = {};
    productionData.forEach(record => {
      dailyTotalsMap[record.date] = (dailyTotalsMap[record.date] || 0) + record.amount;
    });

    const sortedDates = Object.keys(dailyTotalsMap).sort();
    const latestIdx = sortedDates.indexOf(latestDateInSystem);

    if (latestIdx === -1) return { avg7: 0, avg30: 0 };

    const last7Dates = sortedDates.slice(Math.max(0, latestIdx - 6), latestIdx + 1);
    const last30Dates = sortedDates.slice(Math.max(0, latestIdx - 29), latestIdx + 1);

    const sum7 = last7Dates.reduce((acc, date) => acc + dailyTotalsMap[date], 0);
    const sum30 = last30Dates.reduce((acc, date) => acc + dailyTotalsMap[date], 0);

    return {
      avg7: last7Dates.length ? Math.round(sum7 / last7Dates.length) : 0,
      avg30: last30Dates.length ? Math.round(sum30 / last30Dates.length) : 0,
    };
  }, [productionData, latestDateInSystem]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (dayRecords.length === 0) {
        setInsights("No data available for AI analysis on this date.");
        setLoadingInsights(false);
        return;
      }
      setLoadingInsights(true);
      try {
        const text = await getAIInsights(productionData, selectedDate);
        setInsights(text);
      } catch (e) {
        setInsights("AI Insights currently unavailable.");
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [selectedDate, productionData]);

  const renderWorkforceRow = (label: string, icon: React.ReactNode, actual: number, target: number, diff: number, color: string) => {
    const isShortage = diff < 0;
    const isSurplus = diff > 0;
    
    return (
      <div className="flex flex-col gap-1 p-2 md:p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-tight">{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{actual.toLocaleString()}</span>
             <span className="text-[10px] font-bold text-slate-400">/ {target}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1">
          <div className="text-slate-400">Organogram Status</div>
          <div className={`flex items-center gap-1 ${isShortage ? 'text-rose-500' : isSurplus ? 'text-emerald-500' : 'text-slate-400'}`}>
            {isShortage ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
            {isShortage ? 'Shortage' : isSurplus ? 'Surplus' : 'Optimal'} ({isShortage ? '' : '+'}{diff})
          </div>
        </div>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isShortage ? 'bg-amber-500' : 'bg-emerald-500'}`} 
            style={{ width: `${Math.min(100, (actual/target)*100)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-12">
      <div className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 rounded-2xl md:rounded-3xl border shadow-sm transition-all ${!isLatest ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-500'}`}>
        {!isLatest ? (
          <>
            <History size={16} className="md:w-5 md:h-5" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-[8px] md:text-xs">Historical Archive View</span>
              <span className="text-[7px] md:text-[9px] opacity-70 font-bold uppercase">{selectedDate} Records</span>
            </div>
          </>
        ) : (
          <>
            <Zap size={16} className="md:w-5 md:h-5 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-[8px] md:text-xs">Live Operational Status</span>
              <span className="text-[7px] md:text-[9px] opacity-70 font-bold uppercase">Streaming Latest Logs</span>
            </div>
            <span className="ml-auto flex h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </>
        )}
      </div>

      {/* Row 1: Primary Metrics */}
      <div className="grid grid-cols-1 xl:grid-cols-4 4k:grid-cols-4 gap-4 md:gap-6">
        {/* Aggregate Daily Production (Gas) */}
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center xl:col-span-2 4k:col-span-2 relative overflow-hidden group">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="p-1.5 md:p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400"><Activity size={20} /></div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[8px] md:text-xs">Aggregate Daily Gas Production</span>
          </div>
          
          <div className="flex flex-col 4k:flex-row 4k:items-end gap-4 4k:gap-10 mb-4 4k:mb-6">
            <div>
              <div className="text-4xl md:text-6xl 4k:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{totalProduction.toLocaleString()}</div>
              <div className="text-[10px] md:text-xs 4k:text-sm text-slate-400 dark:text-slate-500 font-bold uppercase mt-0">Million Cubic Feet (MCF)</div>
            </div>
            
            <div className="grid grid-cols-2 md:flex md:flex-col gap-4 md:gap-2 pb-2 border-l-0 4k:border-l border-slate-200 dark:border-slate-700 pl-0 4k:pl-8">
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">7D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-base md:text-lg 4k:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{historicalMetrics.avg7.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">30D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-base md:text-lg 4k:text-xl font-black text-slate-700 dark:text-slate-300 font-mono">{historicalMetrics.avg30.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-auto pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-700/50 text-[10px] md:text-xs flex items-center justify-between font-bold`}>
            <div className={`flex items-center gap-1.5 ${totalProduction >= historicalMetrics.avg7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
               <TrendingUp size={14} className={`${totalProduction < historicalMetrics.avg7 ? 'rotate-180' : ''} md:w-5 md:h-5`} /> 
               {totalProduction >= historicalMetrics.avg7 ? 'ABOVE 7D AVG' : 'BELOW 7D NORM'}
            </div>
          </div>
        </div>

        {/* Liquid Metrics (Condensate & Water) */}
        <div className="grid grid-rows-2 gap-4 md:gap-6 xl:col-span-1 4k:col-span-1">
          <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-center relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical size={16} className="text-blue-500" />
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[8px] md:text-xs">Condensate</span>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalCondensate.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">BBL</span></div>
          </div>
          <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col justify-center relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-2">
              <Droplets size={16} className="text-amber-500" />
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[8px] md:text-xs">Produced Water</span>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalWater.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">BBL</span></div>
          </div>
        </div>

        {/* Workforce Card - Benchmarked against Dynamic Organogram from DB */}
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-between relative overflow-hidden xl:col-span-1 4k:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400 md:w-5 md:h-5" />
                <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Workforce Analysis</h3>
              </div>
              <span className="text-[8px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">BGFCL Target</span>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {renderWorkforceRow('Officers', <Briefcase size={14} />, stats.officers, stats.targetOfficers, stats.offDiff, 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}
              {renderWorkforceRow('Staff', <Users size={14} />, stats.employees, stats.targetEmployees, stats.empDiff, 'bg-blue-500/10 text-blue-600 dark:text-blue-400')}
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"><Target size={14} /></div>
                  <span className="text-slate-800 dark:text-slate-200 font-black text-[10px] md:text-xs uppercase tracking-tighter">Total Strength</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{stats.total.toLocaleString()}</div>
                  <div className={`text-[8px] font-black uppercase ${stats.totalDiff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    Net {stats.totalDiff < 0 ? 'Shortage' : 'Surplus'}: {stats.totalDiff < 0 ? '' : '+'}{stats.totalDiff}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Breakdown (Larger) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 4k:grid-cols-6 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm xl:col-span-3 4k:col-span-4">
          <div className="flex items-center gap-3 mb-4">
            <LayoutList size={18} className="text-emerald-500" />
            <h3 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Field-wise Operational Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 4k:grid-cols-6 gap-2 md:gap-4">
            {dayRecords.map((record) => (
              <div key={record.field} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col">
                <div className="text-slate-400 dark:text-slate-500 font-black text-[12px] md:text-[14px] uppercase tracking-widest mb-2 truncate">{record.field}</div>
                <div className="space-y-1">
                  <div className="text-emerald-600 dark:text-emerald-400 font-black text-lg md:text-xl font-mono">{record.amount.toLocaleString()} <span className="text-[8px] text-slate-400 uppercase font-sans">MCF</span></div>
                  <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold">
                    <span className="text-blue-500 uppercase tracking-tighter">Cond:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{record.condensate?.toLocaleString() || 0} BBL</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold">
                    <span className="text-amber-500 uppercase tracking-tighter">Water:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{record.water?.toLocaleString() || 0} BBL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {dayRecords.length === 0 && <div className="text-slate-400 dark:text-slate-500 text-center py-10 font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">No data found</div>}
        </div>
        
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl xl:col-span-1 4k:col-span-2">
          <FieldDistributionChart data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Row 3: Trend | Benchmarking | Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-8 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg xl:col-span-3">
           <HistoricalTrendChart data={productionData} centerDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg xl:col-span-3">
           <FieldComparisonBar data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl xl:col-span-2">
           <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-purple-500" />
              <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Executive Intelligence</h3>
           </div>
           <div className={`text-xs md:text-sm 4k:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium transition-opacity duration-700 ${loadingInsights ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>{insights}</div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><Clock size={16} className="text-slate-400" /> Recent Field Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]"><ProductionTable data={productionData} /></div>
      </div>
    </div>
  );
};

export default Dashboard;
