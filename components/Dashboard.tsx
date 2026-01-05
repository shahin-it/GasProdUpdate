
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

      <div className="grid grid-cols-1 xl:grid-cols-4 4k:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800/80 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center xl:col-span-1 4k:col-span-1 relative overflow-hidden group">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="p-1.5 md:p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400"><Activity size={20} /></div>
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[8px] md:text-xs">Aggregate Daily Production</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-10 mb-4 md:mb-6">
            <div>
              <div className="text-5xl md:text-7xl 4k:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{totalProduction.toLocaleString()}</div>
              <div className="text-[10px] md:text-sm 4k:text-lg text-slate-400 dark:text-slate-500 font-bold uppercase mt-0">Million Cubic Feet (MCF)</div>
            </div>
            
            <div className="grid grid-cols-2 md:flex md:flex-col gap-4 md:gap-2 pb-2 border-l-0 md:border-l border-slate-200 dark:border-slate-700 pl-0 md:pl-8">
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">7D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl 4k:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{historicalMetrics.avg7.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[7px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">30D Mean</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg md:text-xl 4k:text-2xl font-black text-slate-700 dark:text-slate-300 font-mono">{historicalMetrics.avg30.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-auto pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-700/50 text-[10px] md:text-sm flex items-center justify-between font-bold`}>
            <div className={`flex items-center gap-1.5 ${totalProduction >= historicalMetrics.avg7 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
               <TrendingUp size={14} className={`${totalProduction < historicalMetrics.avg7 ? 'rotate-180' : ''} md:w-5 md:h-5`} /> 
               {totalProduction >= historicalMetrics.avg7 ? 'ABOVE 7D AVG' : 'BELOW 7D NORM'}
            </div>
            <div className="text-[7px] md:text-[8px] text-slate-300 dark:text-slate-600 uppercase font-black tracking-widest">Telemetry Active</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm xl:col-span-2 4k:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <LayoutList size={18} className="text-emerald-500" />
            <h3 className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Production Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {dayRecords.map((record) => (
                <div key={record.field} className="p-3 md:p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col">
                  <div className="text-slate-400 dark:text-slate-500 font-black text-[12px] md:text-[14px] uppercase tracking-widest mb-1 truncate">{record.field}</div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-black text-xl md:text-xxl font-mono">{record.amount.toLocaleString()} <span className="text-[8px] md:text-[10px] text-slate-400 dark:text-slate-600 uppercase font-sans">MCF</span></div>
                </div>
            ))}
          </div>
          {dayRecords.length === 0 && <div className="text-slate-400 dark:text-slate-500 text-center py-10 font-bold uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">No data found</div>}
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-between relative overflow-hidden xl:col-span-1 4k:col-span-1">
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <span className="text-[6px] md:text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">LATEST</span>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-slate-400 md:w-5 md:h-5" />
              <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Workforce</h3>
            </div>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400"><Briefcase size={16} /></div>
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-xs md:text-sm uppercase">Officers</span>
                </div>
                <div className="text-2xl md:text-3xl 4k:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{latestPersonnel?.officers.toLocaleString() || "---"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 md:p-2 bg-emerald-500/10 rounded-lg text-emerald-600 dark:text-emerald-400"><Users size={16} /></div>
                  <span className="text-slate-600 dark:text-slate-300 font-bold text-xs md:text-sm uppercase">Employees</span>
                </div>
                <div className="text-2xl md:text-3xl 4k:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{latestPersonnel?.employees.toLocaleString() || "---"}</div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-4">
            <p className="text-[7px] md:text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Staff Snapshot</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 4k:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl xl:col-span-1 4k:col-span-1">
          <FieldDistributionChart data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg xl:col-span-2 4k:col-span-1">
           <HistoricalTrendChart data={productionData} centerDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg xl:col-span-1 4k:col-span-1">
           <FieldComparisonBar data={productionData} targetDate={selectedDate} isDarkMode={isDarkMode} />
        </div>
        <div className="bg-white dark:bg-slate-800/50 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg flex flex-col xl:col-span-2 4k:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest"><Clock size={16} className="text-slate-400" /> Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] 4k:max-h-full"><ProductionTable data={productionData} /></div>
        </div>
        <div className="bg-white dark:bg-slate-800/80 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl xl:col-span-2 4k:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-purple-500" />
            <h3 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Executive Intelligence</h3>
          </div>
          <div className={`text-xs md:text-sm 4k:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium transition-opacity duration-700 ${loadingInsights ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>{insights}</div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;