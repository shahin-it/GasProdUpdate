
import React from 'react';
import { ProductionRecord } from '../types';

interface Props {
  data: ProductionRecord[];
}

const ProductionTable: React.FC<Props> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Field Name</th>
            <th className="px-6 py-4 font-semibold text-right">Production (MCF)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedData.map((record) => (
            <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">{record.date}</td>
              <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{record.field}</td>
              <td className="px-6 py-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {record.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductionTable;
