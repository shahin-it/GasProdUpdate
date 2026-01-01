
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord, PersonnelRecord } from '../types.ts';
import { FieldDistributionChart, HistoricalTrendChart, FieldComparisonBar } from './Charts.tsx';
import ProductionTable from './ProductionTable.tsx';
import { getAIInsights } from '../services/geminiService.ts';
import { Sparkles, TrendingUp, Activity, Clock, LayoutList, History, Zap, Users, Briefcase, BarChart3 } from 'lucide-react';

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
  
  const totalProduction = useMemo(() => dayRecords.reduce((acc, curr) => acc + curr.amount, 0), [dayRecords]);
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

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      <div className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl border shadow-sm transition-all ${!isLatest ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-500'}`}>
        {!isLatest ? (
          <>
            <History size={20} className="md:size-6" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-[10px] md:text-sm">Historical Archive View</span>
              <span className="text-[8px] md:text-[10px] opacity-70 font-bold uppercase">{selectedDate} Records</span>
            </div>
          </>
        ) : (
          <>
            <Zap size={20} className="md:size-6 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-[10px] md:text-sm">Live Operational Status</span>
              <span className="text-[8px] md:text-[10px] opacity-70 font-bold uppercase">Streaming Latest Logs</span>
            </div>
            <span className="ml-auto flex h-2 w-2 md:h-3 md:w-3 rounded-full bg-emerald-500 animate-ping"></span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center lg:col-span-2 relative overflow-hidden group">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <div className="p-2 md:p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl md:rounded-2xl text-blue-600 dark:text-blue-400"><Activity size={24} /></div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] md:text-sm">Aggregate Daily Production</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 mb-6 md:mb-8">
            <div>
              <div className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter">{totalProduction.toLocaleString()}</div>
              <div className="text-sm md:text-xl text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">Million Cubic Feet (MCF)</div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-6 md:gap-3 pb-2 border-l-0 md:border-l border-slate-200 dark:border-slate-700 pl-0 md:pl-6">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">7D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{historicalMetrics.avg7.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">30D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">{historicalMetrics.avg30.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-auto pt-4 md:pt-6 border-t border-slate-100 dark:border-slate-700/50 text-xs md:text-lg flex items-center justify-between font-bold`}>
            <div className={`flex items-center gap-2 ${totalProduction >= historicalMetrics.avg7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
               <TrendingUp size={16} className={`${totalProduction < historicalMetrics.avg7 ? 'rotate-180' : ''} md:size-6`} /> 
               {totalProduction >= historicalMetrics.avg7 ? 'ABOVE 7D AVG' : 'BELOW 7D NORM'}
            </div>
            <div className="text-[8px] md:text-[10px] text-slate-300 dark:text-slate-600 uppercase font-black tracking-widest">Telemetry Active</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <span className="text-[7px] md:text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">LATEST</span>
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <Users size={20} className="text-slate-400 md:size-6" />
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Workforce Status</h3>
            </div>
            <div className="space-y-6 md:space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400"><Briefcase size={20} className="md:size-6" /></div>
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-sm md:text-lg uppercase">Officers</span>
                </div>
                <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{latestPersonnel?.officers.toLocaleString() || "---"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2 md:p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400"><Users size={20} className="md:size-6" /></div>
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-sm md:text-lg uppercase">Employees</span>
                </div>
                <div className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{latestPersonnel?.employees.toLocaleString() || "---"}</div>
              </div>
            </div>
          </div>
          <div className="pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-700/50 mt-4">
            <p className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Current Distribution</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <LayoutList size={20} className="text-emerald-500 md:size-6" />
            <h3 className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Production Breakdown</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {dayRecords.map((record) => (
              <div key={record.field} className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between">
                <div className="text-slate-800 dark:text-slate-100 font-black text-base md:text-xl uppercase tracking-tight">{record.field}</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-black text-xl md:text-2xl font-mono">{record.amount.toLocaleString()} <span className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-600 uppercase font-sans">MCF</span></div>
              </div>
            ))}
          </div>
          {dayRecords.length === 0 && <div className="text-slate-400 dark:text-slate-500 text-center py-12 md:py-20 font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl">No data found</div>}
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl"><FieldDistributionChart data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg"><HistoricalTrendChart data={productionData} centerDate={selectedDate} isDarkMode={isDarkMode} /></div>
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg"><FieldComparisonBar data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="p-2 md:p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg md:rounded-xl text-purple-600 dark:text-purple-400"><Sparkles size={24} className="md:size-7" /></div>
            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Executive Intelligence</h2>
          </div>
          <div className={`text-base md:text-2xl text-slate-700 dark:text-slate-200 leading-relaxed font-medium transition-opacity duration-700 max-w-4xl ${loadingInsights ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>{insights}</div>
          <div className="absolute -bottom-10 md:-bottom-20 -right-10 md:-right-20 opacity-5 text-purple-200 pointer-events-none"><Sparkles size={200} className="md:size-[300px]" /></div>
        </div>
        <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 md:gap-3"><Clock size={20} className="text-slate-400" /> Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] md:max-h-[400px]"><ProductionTable data={productionData} /></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
