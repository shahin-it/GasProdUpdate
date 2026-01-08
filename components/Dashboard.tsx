
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
      <div className="flex flex-col gap-1 p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 executive-card transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
            <span className="text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-tight">{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-xl font-black text-slate-900 dark:text-white">{actual.toLocaleString()}</span>
             <span className="text-[10px] font-bold text-slate-400">/ {target}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mt-1">
          <div className="text-slate-400">Org Status</div>
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
    <div className="space-y-6 md:space-y-8 pb-16">
      <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border shadow-sm transition-all ${!isLatest ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-500'}`}>
        {!isLatest ? (
          <>
            <History size={18} />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-xs">Historical Archive Data</span>
              <span className="text-[10px] opacity-70 font-bold uppercase">{selectedDate} Records Active</span>
            </div>
          </>
        ) : (
          <>
            <Zap size={18} className="animate-pulse" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-xs">Command Center • Live Operations</span>
              <span className="text-[10px] opacity-70 font-bold uppercase">Real-time Telemetry Active</span>
            </div>
            <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </>
        )}
      </div>

      {/* Primary Desktop-Scale Row */}
      <div className="grid grid-cols-1 tv:grid-cols-12 gap-6">
        
        {/* Main Production Metric - Massive Focus */}
        <div className="tv:col-span-5 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-center relative overflow-hidden executive-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <Activity size={24} />
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Aggregate Daily Gas Production</span>
          </div>
          
          <div className="flex items-end gap-6 mb-8">
            <div>
              <div className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{totalProduction.toLocaleString()}</div>
              <div className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase mt-2">Million Cubic Feet (MCF)</div>
            </div>
            <div className="flex flex-col pb-2 border-l border-slate-100 dark:border-slate-800 pl-8 space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">7D Norm</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{historicalMetrics.avg7.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
                <TrendingUp size={16} /> {( (totalProduction / historicalMetrics.avg7) * 100 - 100).toFixed(1)}% VAR
              </div>
            </div>
          </div>
          
          <div className="mt-auto grid grid-cols-2 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase">Status</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Operational • Stable</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase text-right">30D Peak</span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase text-right">{historicalMetrics.avg30.toLocaleString()} MCF</span>
            </div>
          </div>
        </div>

        {/* Liquid and Share Row - High Density */}
        <div className="tv:col-span-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6 h-full">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center executive-card">
              <div className="flex items-center gap-3 mb-3">
                <FlaskConical size={20} className="text-blue-500" />
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Condensate</span>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalCondensate.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">BBL / Total Yield</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-center executive-card">
              <div className="flex items-center gap-3 mb-3">
                <Droplets size={20} className="text-amber-500" />
                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px]">Produced Water</span>
              </div>
              <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalWater.toLocaleString()}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">BBL / Separation</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl executive-card">
             <FieldDistributionChart data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Workforce Side Panel - Desktop Desktop Strength */}
        <div className="tv:col-span-3 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-md flex flex-col executive-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Workforce Audit</h3>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full font-black uppercase">Organogram</span>
          </div>
          
          <div className="space-y-4">
            {renderWorkforceRow('Executive Officers', <Briefcase size={16} />, stats.officers, stats.targetOfficers, stats.offDiff, 'bg-amber-500/10 text-amber-600 dark:text-amber-400')}
            {renderWorkforceRow('General Staff', <Users size={16} />, stats.employees, stats.targetEmployees, stats.empDiff, 'bg-blue-500/10 text-blue-600 dark:text-blue-400')}
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400"><Target size={20} /></div>
                <div className="flex flex-col">
                  <span className="text-slate-800 dark:text-slate-200 font-black text-xs uppercase tracking-tight">Total Workforce</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Field Personnel</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{stats.total.toLocaleString()}</div>
                <div className={`text-[10px] font-black uppercase ${stats.totalDiff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  Gap: {stats.totalDiff < 0 ? '' : '+'}{stats.totalDiff}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and Tables - Commander View */}
      <div className="grid grid-cols-1 tv:grid-cols-12 gap-6">
        
        {/* Field Summaries Grid - Desktop Style Grid */}
        <div className="tv:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl executive-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <LayoutList size={22} className="text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Individual Field Logistics Summary</h3>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-tighter">Sorted by Output</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 tv:grid-cols-3 gap-6">
            {dayRecords.map((record) => (
              <div key={record.field} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-500/40 transition-all group cursor-default">
                <div className="text-slate-400 dark:text-slate-500 font-black text-xs uppercase tracking-widest mb-3 truncate group-hover:text-emerald-500 transition-colors">{record.field}</div>
                <div className="space-y-2">
                  <div className="text-emerald-600 dark:text-emerald-400 font-black text-3xl font-mono leading-none">{record.amount.toLocaleString()} <span className="text-xs text-slate-400 uppercase font-sans">MCF</span></div>
                  <div className="flex justify-between items-center text-[11px] font-bold border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-2">
                    <span className="text-blue-500/80 uppercase tracking-tighter">Condensate</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{record.condensate?.toLocaleString() || 0} BBL</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-amber-500/80 uppercase tracking-tighter">Water</span>
                    <span className="text-slate-700 dark:text-slate-300 font-mono">{record.water?.toLocaleString() || 0} BBL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {dayRecords.length === 0 && <div className="text-slate-400 text-center py-20 font-black uppercase tracking-[0.3em] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">No Logged Data</div>}
        </div>

        {/* AI Executive Intelligence - Vertical Card */}
        <div className="tv:col-span-4 bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32"></div>
          <div className="flex items-center gap-3 mb-8 relative">
            <Sparkles size={24} className="text-emerald-400" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Executive Insight AI</h3>
          </div>
          <div className={`flex-1 text-sm md:text-base text-slate-200 leading-relaxed font-medium relative transition-opacity duration-700 ${loadingInsights ? 'opacity-30 animate-pulse' : 'opacity-100'}`}>
            {insights}
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest relative">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            Powered by Google Gemini 3 Flash
          </div>
        </div>
      </div>

      {/* Row 3: Desktop Trend View */}
      <div className="grid grid-cols-1 tv:grid-cols-12 gap-6">
        <div className="tv:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl executive-card">
           <HistoricalTrendChart data={productionData} centerDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="tv:col-span-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl executive-card">
           <FieldComparisonBar data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Row 4: Activity Log */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col executive-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-[0.2em]">
              <Clock size={20} className="text-slate-400" /> Granular Activity Stream
            </h3>
            <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-500 tracking-widest hover:bg-emerald-500 hover:text-white transition-all">Export (CSV)</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[600px]">
            <ProductionTable data={productionData} />
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
