
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord, PersonnelRecord } from '../types.ts';
import { FieldDistributionChart, HistoricalTrendChart, FieldComparisonBar } from './Charts.tsx';
import ProductionTable from './ProductionTable.tsx';
import { getAIInsights } from '../services/geminiService.ts';
import { Sparkles, TrendingUp, Activity, Clock, LayoutList, History, Zap, Users, Briefcase } from 'lucide-react';

interface Props {
  productionData: ProductionRecord[];
  personnelData: PersonnelRecord[];
  selectedDate: string;
  latestDateInSystem: string;
}

const Dashboard: React.FC<Props> = ({ productionData, personnelData, selectedDate, latestDateInSystem }) => {
  const [insights, setInsights] = useState<string>('Analyzing operational metrics...');
  const [loadingInsights, setLoadingInsights] = useState(true);

  const dayRecords = useMemo(() => productionData.filter(d => d.date === selectedDate), [productionData, selectedDate]);
  const dayPersonnel = useMemo(() => personnelData.find(p => p.date === selectedDate), [personnelData, selectedDate]);
  
  const totalProduction = useMemo(() => dayRecords.reduce((acc, curr) => acc + curr.amount, 0), [dayRecords]);
  const isLatest = selectedDate === latestDateInSystem;

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
    <div className="space-y-8 pb-12">
      {/* Visual Status Indicator */}
      <div className={`flex items-center gap-4 px-6 py-4 rounded-3xl border shadow-lg transition-all ${!isLatest ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'}`}>
        {!isLatest ? (
          <>
            <History size={24} className="animate-in slide-in-from-left duration-300" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-sm">Historical Archive View</span>
              <span className="text-[10px] opacity-70 font-bold uppercase">Viewing finalized records for {selectedDate}</span>
            </div>
          </>
        ) : (
          <>
            <Zap size={24} className="animate-pulse text-emerald-400" />
            <div className="flex flex-col">
              <span className="font-black uppercase tracking-widest text-sm">System Status: Live / Latest</span>
              <span className="text-[10px] opacity-70 font-bold uppercase">Displaying the most recent entries in the production database</span>
            </div>
            <span className="ml-auto flex h-3 w-3 rounded-full bg-emerald-500 animate-ping"></span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center lg:col-span-2">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Activity size={28} /></div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-sm">Aggregate Field Output</span>
          </div>
          <div className="text-7xl font-black text-white mb-2 tracking-tighter">{totalProduction.toLocaleString()}</div>
          <div className="text-xl text-slate-500 font-bold uppercase mb-4">Million Cubic Feet (MCF)</div>
          <div className={`mt-auto pt-6 border-t border-slate-700/50 text-lg flex items-center gap-2 font-bold ${totalProduction > 1500 ? 'text-emerald-400' : 'text-amber-400'}`}>
            <TrendingUp size={24} /> {totalProduction > 1500 ? 'PEAK PERFORMANCE' : 'MONITORING TREND'}
          </div>
        </div>

        <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Users size={24} className="text-slate-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Company Personnel</h3>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><Briefcase size={24} /></div>
                  <span className="text-slate-300 font-bold text-lg uppercase">Officers</span>
                </div>
                <div className="text-5xl font-black text-white tracking-tighter">{dayPersonnel?.officers.toLocaleString() || "---"}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Users size={24} /></div>
                  <span className="text-slate-300 font-bold text-lg uppercase">Employees</span>
                </div>
                <div className="text-5xl font-black text-white tracking-tighter">{dayPersonnel?.employees.toLocaleString() || "---"}</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-700/50">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Corporate Workforce Analytics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <LayoutList size={24} className="text-emerald-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Operational Breakdown</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayRecords.map((record) => (
              <div key={record.field} className="p-6 bg-slate-800/40 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between">
                <div className="text-slate-100 font-black text-xl uppercase tracking-tight">{record.field}</div>
                <div className="text-emerald-400 font-black text-2xl font-mono">{record.amount.toLocaleString()} <span className="text-[10px] text-slate-600 uppercase font-sans">MCF</span></div>
              </div>
            ))}
          </div>
          {dayRecords.length === 0 && <div className="text-slate-500 text-center py-20 font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-3xl">No production logs found for this date.</div>}
        </div>
        <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm"><FieldDistributionChart data={productionData} targetDate={selectedDate} /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg"><HistoricalTrendChart data={productionData} centerDate={selectedDate} /></div>
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg"><FieldComparisonBar data={productionData} targetDate={selectedDate} /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-800/80 p-10 rounded-3xl border border-slate-700 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><Sparkles size={28} /></div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Executive Intelligence</h2>
          </div>
          <div className={`text-2xl text-slate-200 leading-relaxed font-medium transition-opacity duration-700 max-w-4xl ${loadingInsights ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>{insights}</div>
          <div className="absolute -bottom-20 -right-20 opacity-5 text-purple-200 pointer-events-none"><Sparkles size={300} /></div>
        </div>
        <div className="lg:col-span-1 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Clock className="text-slate-400" /> Activity Log</h3>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Audit Trail</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]"><ProductionTable data={productionData} /></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
