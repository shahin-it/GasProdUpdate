
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { ProductionRecord } from '../types.ts';
import { formatDisplayDate } from '../constants.ts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface BaseProps {
  data: ProductionRecord[];
  isDarkMode: boolean;
}

interface TargetedProps extends BaseProps {
  targetDate: string;
}

interface TrendProps extends BaseProps {
  centerDate: string;
}

const getTooltipStyle = (isDarkMode: boolean) => ({
  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
  border: isDarkMode ? 'none' : '1px solid #e2e8f0',
  borderRadius: '8px',
  color: isDarkMode ? '#f8fafc' : '#0f172a',
  boxShadow: isDarkMode ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
});

const getGridColor = (isDarkMode: boolean) => (isDarkMode ? '#334155' : '#e2e8f0');
const getTextColor = (isDarkMode: boolean) => (isDarkMode ? '#94a3b8' : '#64748b');

export const FieldDistributionChart: React.FC<TargetedProps> = ({ data, targetDate, isDarkMode }) => {
  const chartData = useMemo(() => {
    return data
      .filter(d => d.date === targetDate)
      .map(d => ({
        name: d.field,
        value: d.amount
      }));
  }, [data, targetDate]);

  return (
    <div className="h-[350px] w-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Daily Production Share %</h3>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold uppercase tracking-tighter">{formatDisplayDate(targetDate)}</span>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
              stroke={isDarkMode ? '#1e293b' : '#ffffff'}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={getTooltipStyle(isDarkMode)} itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }} />
            <Legend 
              iconType="circle" 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: getTextColor(isDarkMode) }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const HistoricalTrendChart: React.FC<TrendProps> = ({ data, centerDate, isDarkMode }) => {
  const chartData = useMemo(() => {
    const dates: string[] = Array.from(new Set<string>(data.map(d => d.date))).sort();
    const fields: string[] = Array.from(new Set<string>(data.map(d => d.field)));
    
    const targetIdx = dates.indexOf(centerDate);
    const startIdx = Math.max(0, targetIdx - 6);
    const windowDates = dates.slice(startIdx, targetIdx + 1);

    return windowDates.map(date => {
      const entry: any = { date };
      fields.forEach(field => {
        const record = data.find(r => r.date === date && r.field === field);
        entry[field] = record ? record.amount : 0;
      });
      return entry;
    });
  }, [data, centerDate]);

  const fields = useMemo(() => Array.from(new Set<string>(data.map(d => d.field))), [data]);

  return (
    <div className="h-[350px] w-full">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100 uppercase tracking-tight">Window Trend (7D Peak)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            {fields.map((f, i) => (
              <linearGradient key={`grad-${f}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(isDarkMode)} vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke={getTextColor(isDarkMode)} 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatDisplayDate}
          />
          <YAxis stroke={getTextColor(isDarkMode)} fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            labelFormatter={formatDisplayDate}
            contentStyle={getTooltipStyle(isDarkMode)} 
            itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }} 
          />
          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: getTextColor(isDarkMode) }} />
          {fields.map((field, index) => (
            <Area
              key={field}
              type="monotone"
              dataKey={field}
              stroke={COLORS[index % COLORS.length]}
              fillOpacity={1}
              fill={`url(#color-${index})`}
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FieldComparisonBar: React.FC<TargetedProps> = ({ data, targetDate, isDarkMode }) => {
  const dayData = useMemo(() => data.filter(d => d.date === targetDate), [data, targetDate]);

  return (
    <div className="h-[350px] w-full">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100 uppercase tracking-tight">Volume Benchmarking</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dayData}>
          <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(isDarkMode)} vertical={false} />
          <XAxis dataKey="field" stroke={getTextColor(isDarkMode)} fontSize={10} />
          <YAxis stroke={getTextColor(isDarkMode)} fontSize={10} />
          <Tooltip 
            cursor={{ fill: isDarkMode ? '#334155' : '#f1f5f9', opacity: 0.4 }}
            contentStyle={getTooltipStyle(isDarkMode)} 
            itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
          />
          <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
            {dayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
