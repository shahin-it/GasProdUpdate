
import React, { useState, useMemo } from 'react';
import { FIELDS } from '../constants.ts';
import { ProductionRecord, PersonnelRecord } from '../types.ts';
import { 
  PlusCircle, Trash2, Database, AlertCircle, Loader2, XCircle, 
  Edit3, ChevronLeft, ChevronRight, Save, X, Users, Briefcase, LayoutGrid, UserCheck,
  Fuel, Calendar
} from 'lucide-react';

interface Props {
  productionData: ProductionRecord[];
  personnelData: PersonnelRecord[];
  onAddProduction: (record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  onUpdateProduction: (id: string, record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  onDeleteProduction: (id: string) => Promise<void>;
  onAddPersonnel: (record: Omit<PersonnelRecord, 'id'>) => Promise<void>;
  onUpdatePersonnel: (id: string, record: Omit<PersonnelRecord, 'id'>) => Promise<void>;
  onDeletePersonnel: (id: string) => Promise<void>;
}

const RECORDS_PER_PAGE = 8;

const AdminPanel: React.FC<Props> = ({ 
  productionData, personnelData,
  onAddProduction, onUpdateProduction, onDeleteProduction,
  onAddPersonnel, onUpdatePersonnel, onDeletePersonnel
}) => {
  const [activeTab, setActiveTab] = useState<'production' | 'personnel'>('production');

  // Production Form State
  const [field, setField] = useState(FIELDS[0].name);
  const [amount, setAmount] = useState<string>('');
  const [prodDate, setProdDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Personnel Form State
  const [persDate, setPersDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officers, setOfficers] = useState<string>('');
  const [employees, setEmployees] = useState<string>('');
  const [editingPersId, setEditingPersId] = useState<string | null>(null);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount)) { setValidationError("Enter numeric production amount."); return; }
    if (productionData.some(r => r.field === field && r.date === prodDate && r.id !== editingProdId)) {
      setValidationError(`Entry for ${field} on ${prodDate} already exists.`); return;
    }
    setIsSubmitting(true);
    try {
      if (editingProdId) await onUpdateProduction(editingProdId, { field, amount: numAmount, date: prodDate });
      else await onAddProduction({ field, amount: numAmount, date: prodDate });
      setAmount(''); setEditingProdId(null);
    } catch { setValidationError("Database error occurred."); } finally { setIsSubmitting(false); }
  };

  const handlePersonnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    const numOff = Number(officers);
    const numEmp = Number(employees);
    if (isNaN(numOff) || isNaN(numEmp)) { setValidationError("Enter valid personnel counts."); return; }
    if (personnelData.some(p => p.date === persDate && p.id !== editingPersId)) {
       setValidationError(`Personnel data for ${persDate} already exists.`); return;
    }
    setIsSubmitting(true);
    try {
      if (editingPersId) await onUpdatePersonnel(editingPersId, { date: persDate, officers: numOff, employees: numEmp });
      else await onAddPersonnel({ date: persDate, officers: numOff, employees: numEmp });
      setOfficers(''); setEmployees(''); setEditingPersId(null);
    } catch { setValidationError("Personnel database update failed."); } finally { setIsSubmitting(false); }
  };

  const startEditProd = (record: ProductionRecord) => {
    setField(record.field); setAmount(record.amount.toString()); setProdDate(record.date);
    setEditingProdId(record.id); setValidationError(null); setActiveTab('production');
  };

  const startEditPers = (record: PersonnelRecord) => {
    setPersDate(record.date); setOfficers(record.officers.toString()); setEmployees(record.employees.toString());
    setEditingPersId(record.id); setValidationError(null); setActiveTab('personnel');
  };

  const sortedProduction = useMemo(() => [...productionData].sort((a,b) => b.date.localeCompare(a.date)), [productionData]);
  const sortedPersonnel = useMemo(() => [...personnelData].sort((a,b) => b.date.localeCompare(a.date)), [personnelData]);

  const pagedData = activeTab === 'production' 
    ? sortedProduction.slice((currentPage-1)*RECORDS_PER_PAGE, currentPage*RECORDS_PER_PAGE)
    : sortedPersonnel.slice((currentPage-1)*RECORDS_PER_PAGE, currentPage*RECORDS_PER_PAGE);

  const totalPages = Math.ceil((activeTab === 'production' ? productionData.length : personnelData.length) / RECORDS_PER_PAGE);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
      <div className="lg:col-span-1 space-y-6 md:space-y-8">
        <div className="flex bg-white dark:bg-slate-900 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <button onClick={() => { setActiveTab('production'); setValidationError(null); setCurrentPage(1); }} className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'production' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutGrid size={16} /> Production
          </button>
          <button onClick={() => { setActiveTab('personnel'); setValidationError(null); setCurrentPage(1); }} className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'personnel' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
            <UserCheck size={16} /> Personnel
          </button>
        </div>

        <div className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300 ${activeTab === 'personnel' ? 'ring-2 ring-amber-500/20' : 'ring-2 ring-emerald-500/20'}`}>
          <h2 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-2 md:gap-3 text-slate-900 dark:text-white">
            {activeTab === 'production' ? <><Database className="text-emerald-500" size={20} /> Field Logging</> : <><Users className="text-amber-500" size={20} /> Census Update</>}
          </h2>
          {validationError && <div className="mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[10px] md:text-sm font-bold"><XCircle size={16} /> {validationError}</div>}
          
          {activeTab === 'production' ? (
            <form onSubmit={handleProductionSubmit} className="space-y-5 md:space-y-6">
              <div><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Field Selection</label><select value={field} onChange={(e) => setField(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500">{FIELDS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Volume (MCF)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500" required /></div>
                <div><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Log Date</label><input type="date" value={prodDate} onChange={(e) => setProdDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" required /></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 md:py-5 rounded-xl md:rounded-2xl text-white font-black uppercase tracking-widest text-xs md:text-sm shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingProdId ? <Save size={16} /> : <PlusCircle size={16} />} {editingProdId ? "Apply Update" : "Push Log"}</button>
              {editingProdId && <button type="button" onClick={() => setEditingProdId(null)} className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-slate-200 rounded-xl">Cancel</button>}
            </form>
          ) : (
            <form onSubmit={handlePersonnelSubmit} className="space-y-5 md:space-y-6">
              <div><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Census Date</label><input type="date" value={persDate} onChange={(e) => setPersDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500" required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative"><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Officers</label><input type="number" value={officers} onChange={(e) => setOfficers(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" required /></div>
                <div className="relative"><label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Employees</label><input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" required /></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 py-4 md:py-5 rounded-xl md:rounded-2xl text-white font-black uppercase tracking-widest text-xs md:text-sm shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingPersId ? <Save size={16} /> : <UserCheck size={16} />} {editingPersId ? "Update Census" : "Submit Census"}</button>
              {editingPersId && <button type="button" onClick={() => setEditingPersId(null)} className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-slate-200 rounded-xl">Cancel</button>}
            </form>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-10 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl h-full flex flex-col min-h-[500px] md:min-h-[700px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div><h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white">{activeTab === 'production' ? "Production Logs" : "Personnel Logs"}</h2></div>
            <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest self-start">PAGE {currentPage} / {totalPages || 1}</div>
          </div>

          <div className="flex-1 space-y-3 md:space-y-4">
            {activeTab === 'production' ? (
               (pagedData as ProductionRecord[]).map(record => (
                 <div key={record.id} className="flex items-center justify-between p-4 md:p-6 bg-slate-50 dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 transition-all shadow-sm">
                    <div className="flex items-center gap-3 md:gap-6">
                      <div className="hidden sm:block bg-white dark:bg-slate-800 p-2 md:p-3 rounded-lg md:rounded-xl text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700"><Fuel size={20} /></div>
                      <div><div className="font-black text-sm md:text-lg text-slate-800 dark:text-slate-100">{record.field}</div><div className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> {record.date}</div></div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="text-right"><div className="text-lg md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{record.amount.toLocaleString()}</div><div className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">MCF</div></div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button onClick={() => startEditProd(record)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-400/10 rounded-lg"><Edit3 size={16} /></button>
                        <button onClick={async () => { if(confirm("Delete record?")) { setLoadingActionId(record.id); await onDeleteProduction(record.id); setLoadingActionId(null); } }} className="p-1.5 md:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg">{loadingActionId === record.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}</button>
                      </div>
                    </div>
                 </div>
               ))
            ) : (
              (pagedData as PersonnelRecord[]).map(record => (
                <div key={record.id} className="flex items-center justify-between p-4 md:p-6 bg-slate-50 dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-amber-500/30 transition-all shadow-sm">
                   <div className="flex items-center gap-3 md:gap-6">
                     <div className="hidden sm:block bg-white dark:bg-slate-800 p-2 md:p-3 rounded-lg md:rounded-xl text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700"><UserCheck size={20} /></div>
                     <div><div className="font-black text-sm md:text-lg text-slate-800 dark:text-slate-100">Census</div><div className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> {record.date}</div></div>
                   </div>
                   <div className="flex items-center gap-4 md:gap-10">
                     <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right"><div className="text-base md:text-xl font-black text-amber-600 dark:text-amber-500 font-mono">{record.officers}</div><div className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">OFF.</div></div>
                        <div className="text-right"><div className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{record.employees}</div><div className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase">EMP.</div></div>
                     </div>
                     <div className="flex items-center gap-1 md:gap-2">
                       <button onClick={() => startEditPers(record)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-400/10 rounded-lg"><Edit3 size={16} /></button>
                       <button onClick={async () => { if(confirm("Delete census?")) { setLoadingActionId(record.id); await onDeletePersonnel(record.id); setLoadingActionId(null); } }} className="p-1.5 md:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg">{loadingActionId === record.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}</button>
                     </div>
                   </div>
                </div>
              ))
            )}
            {pagedData.length === 0 && <div className="text-center py-24 md:py-40 text-slate-400 dark:text-slate-600 flex flex-col items-center gap-4"><AlertCircle size={32} md:size={48} className="opacity-10" /><p className="font-black uppercase tracking-widest text-xs md:text-sm">Empty State</p></div>}
          </div>

          {totalPages > 1 && (
            <div className="mt-auto pt-6 md:pt-10 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
               <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg md:rounded-xl text-slate-500 font-black uppercase text-[8px] md:text-xs tracking-widest disabled:opacity-20 transition-all"><ChevronLeft size={14} /> Prev</button>
               <div className="flex gap-1 md:gap-2">
                 <div className="text-[10px] md:text-sm font-black text-slate-400 px-2">Page {currentPage} of {totalPages}</div>
               </div>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg md:rounded-xl text-slate-500 font-black uppercase text-[8px] md:text-xs tracking-widest disabled:opacity-20 transition-all">Next <ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
