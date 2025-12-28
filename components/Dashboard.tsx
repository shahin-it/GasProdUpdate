
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord } from '../types';
import { FieldDistributionChart, HistoricalTrendChart, FieldComparisonBar } from './Charts';
import ProductionTable from './ProductionTable';
import { getAIInsights } from '../services/geminiService';
import { Sparkles, TrendingUp, Activity, Clock, LayoutList, History, Zap } from 'lucide-react';

interface Props {
  data: ProductionRecord[];
  selectedDate: string;
  latestDateInSystem: string;
}

const Dashboard: React.FC<Props> = ({ data, selectedDate, latestDateInSystem }) => {
  const [insights, setInsights] = useState<string>('Analyzing temporal data...');
  const [loadingInsights, setLoadingInsights] = useState(true);

  // Filter data for the specific selected date
  const dayRecords = useMemo(() => 
    data.filter(d => d.date === selectedDate),
    [data, selectedDate]
  );
  
  const totalProduction = useMemo(() => 
    dayRecords.reduce((acc, curr) => acc + curr.amount, 0),
    [dayRecords]
  );

  const isHistorical = selectedDate !== latestDateInSystem;

  useEffect(() => {
    const fetchInsights = async () => {
      if (dayRecords.length === 0) return;
      setLoadingInsights(true);
      const text = await getAIInsights(data, selectedDate);
      setInsights(text);
      setLoadingInsights(false);
    };
    fetchInsights();
  }, [selectedDate, data]);

  return (
    <div className="space-y-8 pb-12">
      {/* Visual Status Indicator */}
      <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border ${isHistorical ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'} transition-all`}>
        {isHistorical ? <History size={20} /> : <Zap size={20} className="animate-pulse" />}
        <span className="font-black uppercase tracking-widest text-sm">
          {isHistorical ? `Historical View: ${selectedDate}` : `Live Performance Snapshot: ${selectedDate}`}
        </span>
        {!isHistorical && <span className="ml-auto flex h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>}
      </div>

      {/* Top Section: Vital Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. Headline Metric */}
        <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
              <Activity size={28} />
            </div>
            <span className="text-slate-400 font-bold uppercase tracking-wider text-sm">Total Output Volume</span>
          </div>
          <div className="text-7xl font-black text-white mb-2 tracking-tighter">
            {totalProduction.toLocaleString()}
          </div>
          <div className="text-xl text-slate-500 font-bold uppercase mb-4">Million Cubic Feet</div>
          <div className={`mt-auto pt-6 border-t border-slate-700/50 text-lg flex items-center gap-2 font-bold ${totalProduction > 1500 ? 'text-emerald-400' : 'text-amber-400'}`}>
            <TrendingUp size={24} /> {totalProduction > 1500 ? 'OPTIMAL PRODUCTION' : 'LOW OUTPUT ALERT'}
          </div>
        </div>

        {/* 2. Field-wise Update List */}
        <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <LayoutList size={24} className="text-emerald-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Field Breakdowns</h3>
          </div>
          <div className="space-y-3">
            {dayRecords.map((record) => (
              <div key={record.field} className="flex items-center justify-between group border-b border-slate-800 pb-2">
                <div className="text-slate-400 font-bold text-base group-hover:text-white transition-colors">{record.field}</div>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-xl font-mono">
                    {record.amount}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-600 font-bold uppercase">MCF</span>
                </div>
              </div>
            ))}
            {dayRecords.length === 0 && (
              <div className="text-slate-500 italic text-center py-12">
                <p className="text-lg font-bold">No Data Logged</p>
                <p className="text-xs uppercase tracking-widest mt-2">Zero records for this timestamp</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Field Distribution Pie Chart */}
        <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm flex flex-col justify-center">
          <FieldDistributionChart data={data} targetDate={selectedDate} />
        </div>
      </div>

      {/* Middle Grid: Trend & Comparison */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg">
          <HistoricalTrendChart data={data} centerDate={selectedDate} />
        </div>
        <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg">
          <FieldComparisonBar data={data} targetDate={selectedDate} />
        </div>
      </div>

      {/* Bottom Grid: AI Summary & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Strategic Analysis */}
        <div className="bg-slate-800/80 p-10 rounded-3xl border border-slate-700 shadow-xl backdrop-blur-sm lg:col-span-2 relative overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
              <Sparkles size={28} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">AI Executive Summary</h2>
          </div>
          <div className={`text-2xl text-slate-200 leading-relaxed font-medium transition-opacity duration-700 max-w-4xl ${loadingInsights ? 'opacity-40 animate-pulse' : 'opacity-100'}`}>
            {insights}
          </div>
          <div className="absolute -bottom-20 -right-20 opacity-5 text-purple-200 pointer-events-none">
            <Sparkles size={300} />
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-700/50 flex items-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              Generative Analysis Active
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Temporal Processing
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-1 bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Clock className="text-slate-400" /> Archive Logs
            </h3>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-black text-slate-500 uppercase">Audit</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <ProductionTable data={data} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
