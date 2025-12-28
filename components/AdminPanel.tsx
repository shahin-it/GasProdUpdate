
import React, { useState, useMemo } from 'react';
import { FIELDS } from '../constants';
import { ProductionRecord } from '../types';
import { 
  PlusCircle, Trash2, Database, AlertCircle, Loader2, XCircle, 
  Edit3, ChevronLeft, ChevronRight, Save, X, Users, Briefcase
} from 'lucide-react';

interface Props {
  data: ProductionRecord[];
  onAdd: (record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  onUpdate: (id: string, record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RECORDS_PER_PAGE = 10;

const AdminPanel: React.FC<Props> = ({ data, onAdd, onUpdate, onDelete }) => {
  // Form State
  const [field, setField] = useState(FIELDS[0].name);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officers, setOfficers] = useState<string>('');
  const [employees, setEmployees] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination Logic
  const sortedData = useMemo(() => 
    [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [data]
  );
  
  const totalPages = Math.ceil(sortedData.length / RECORDS_PER_PAGE);
  const currentRecords = useMemo(() => {
    const start = (currentPage - 1) * RECORDS_PER_PAGE;
    return sortedData.slice(start, start + RECORDS_PER_PAGE);
  }, [sortedData, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const numAmount = Number(amount);
    const numOfficers = Number(officers || 0);
    const numEmployees = Number(employees || 0);

    if (!amount || isNaN(numAmount)) {
      setValidationError("Please enter a valid numeric amount.");
      return;
    }

    if (isNaN(numOfficers) || isNaN(numEmployees)) {
      setValidationError("Officer and Employee counts must be numbers.");
      return;
    }

    // Duplicate Validation
    const isDuplicate = data.some(
      (record) => record.field === field && record.date === date && record.id !== editingId
    );

    if (isDuplicate) {
      setValidationError(`Data for "${field}" on ${date} already exists. Please edit that record or use a different date.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        field, 
        amount: numAmount, 
        date, 
        officers: numOfficers, 
        employees: numEmployees 
      };

      if (editingId) {
        await onUpdate(editingId, payload);
        setEditingId(null);
      } else {
        await onAdd(payload);
      }
      setAmount('');
      setOfficers('');
      setEmployees('');
      if (!editingId) setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setValidationError("An error occurred while saving. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (record: ProductionRecord) => {
    setField(record.field);
    setAmount(record.amount.toString());
    setDate(record.date);
    setOfficers((record.officers || 0).toString());
    setEmployees((record.employees || 0).toString());
    setEditingId(record.id);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setOfficers('');
    setEmployees('');
    setField(FIELDS[0].name);
    setDate(new Date().toISOString().split('T')[0]);
    setValidationError(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
      if (currentRecords.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Entry / Edit Form */}
      <div className="lg:col-span-1">
        <div className={`bg-slate-800 p-8 rounded-2xl shadow-xl border transition-all duration-300 ${editingId ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
              {editingId ? (
                <>
                  <Edit3 className="text-amber-500" /> Edit Record
                </>
              ) : (
                <>
                  <Database className="text-blue-500" /> Data Entry
                </>
              )}
            </h2>
            {editingId && (
              <button 
                onClick={cancelEdit}
                className="text-slate-400 hover:text-white p-1"
                title="Cancel Edit"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {validationError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
              <XCircle className="shrink-0 mt-0.5" size={18} />
              <p className="font-medium">{validationError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Gas Field</label>
              <select 
                value={field}
                onChange={(e) => {
                  setField(e.target.value);
                  setValidationError(null);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {FIELDS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Production (MCF)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Date</label>
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Officer Count</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="number"
                    value={officers}
                    onChange={(e) => setOfficers(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Employee Count</label>
                <div className="relative">
                  <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="number"
                    value={employees}
                    onChange={(e) => setEmployees(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                  editingId 
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20 text-white' 
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> {editingId ? 'Updating...' : 'Committing...'}
                  </>
                ) : (
                  <>
                    {editingId ? <Save size={20} /> : <PlusCircle size={20} />}
                    {editingId ? 'Update PostgreSQL Record' : 'Push to PostgreSQL'}
                  </>
                )}
              </button>
              {editingId && (
                <button 
                  type="button"
                  onClick={cancelEdit}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-lg transition-all"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Recent Records List with Pagination */}
      <div className="lg:col-span-2">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 h-full flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Production & Personnel Archive</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Displaying {currentRecords.length} of {data.length} Total Records
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                Page {currentPage} / {totalPages || 1}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {currentRecords.map(record => (
              <div 
                key={record.id} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-900 rounded-xl border group transition-all duration-200 ${
                  editingId === record.id 
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-900/10' 
                    : 'border-slate-700/50 hover:border-blue-500/30'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`font-black text-lg ${editingId === record.id ? 'text-amber-400' : 'text-slate-100'}`}>
                      {record.field}
                    </div>
                    {editingId === record.id && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                        Active Edit
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span className="flex items-center gap-1 font-bold"><ChevronRight size={12} className="text-slate-600" /> {record.date}</span>
                    <span className="text-emerald-400 font-mono font-bold">{record.amount.toLocaleString()} MCF</span>
                    <span className="flex items-center gap-1.5 text-amber-500/80"><Briefcase size={14} /> {record.officers} Officers</span>
                    <span className="flex items-center gap-1.5 text-emerald-500/80"><Users size={14} /> {record.employees} Employees</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <button 
                    onClick={() => startEdit(record)}
                    disabled={isSubmitting}
                    className="p-2.5 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                    title="Edit Record"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(record.id)}
                    disabled={deletingId === record.id || isSubmitting}
                    className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete Record"
                  >
                    {deletingId === record.id ? (
                      <Loader2 size={18} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {data.length === 0 && (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
                <AlertCircle size={48} className="opacity-20" />
                <p className="font-bold uppercase tracking-widest text-sm">PostgreSQL Table Empty</p>
                <p className="text-xs text-slate-600">Please seed the database using the entry form.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-700/50">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 rounded-lg border font-bold text-sm transition-all ${
                      currentPage === page 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20 scale-110' 
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-sm"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
