
import React, { useState, useMemo, useRef } from 'react';
import { FIELDS, ORGANOGRAM, formatDisplayDate } from '../constants.ts';
import { ProductionRecord, PersonnelRecord } from '../types.ts';
import * as XLSX from 'xlsx';
import { 
  PlusCircle, Trash2, Database, AlertCircle, Loader2, XCircle, 
  Edit3, ChevronLeft, ChevronRight, Save, X, Users, Briefcase, LayoutGrid, UserCheck,
  Fuel, Calendar, Droplets, FlaskConical, Target, FileUp, CheckCircle2, FileSpreadsheet
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Production Form State
  const [field, setField] = useState(FIELDS[0].name);
  const [amount, setAmount] = useState<string>('');
  const [condensate, setCondensate] = useState<string>('');
  const [water, setWater] = useState<string>('');
  const [prodDate, setProdDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  // Personnel Form State
  const [persDate, setPersDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [officers, setOfficers] = useState<string>('');
  const [employees, setEmployees] = useState<string>('');
  const [appOfficers, setAppOfficers] = useState<string>(ORGANOGRAM.OFFICERS.toString());
  const [appEmployees, setAppEmployees] = useState<string>(ORGANOGRAM.EMPLOYEES.toString());
  const [editingPersId, setEditingPersId] = useState<string | null>(null);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMsg(null);
    const numAmount = Number(amount);
    const numCond = Number(condensate || 0);
    const numWater = Number(water || 0);

    if (!amount || isNaN(numAmount)) { setValidationError("Enter numeric gas production amount."); return; }
    if (isNaN(numCond) || isNaN(numWater)) { setValidationError("Enter numeric liquid production values."); return; }

    if (productionData.some(r => r.field === field && r.date === prodDate && r.id !== editingProdId)) {
      setValidationError(`Entry for ${field} on ${formatDisplayDate(prodDate)} already exists.`); return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        field, 
        amount: numAmount, 
        condensate: numCond, 
        water: numWater, 
        date: prodDate 
      };
      if (editingProdId) await onUpdateProduction(editingProdId, payload);
      else await onAddProduction(payload);
      
      setAmount(''); setCondensate(''); setWater(''); 
      setEditingProdId(null);
      setSuccessMsg(`Successfully saved ${field} log.`);
    } catch { setValidationError("Database error occurred."); } finally { setIsSubmitting(false); }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setValidationError(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        // Parse workbook with cellDates: true to handle Excel date objects properly
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const getCellValue = (cellRef: string): any => {
          const cell = sheet[cellRef];
          return cell ? cell.v : null;
        };

        const getNumericValue = (cellRef: string): number => {
          const val = getCellValue(cellRef);
          if (typeof val === 'number') return val;
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Date extraction from S12 with -1 day offset
        const rawDateValue = getCellValue('S12');
        if (!rawDateValue) {
          throw new Error("Date cell S12 is empty.");
        }

        let reportDate: Date;
        if (rawDateValue instanceof Date) {
          reportDate = rawDateValue;
        } else if (typeof rawDateValue === 'number') {
          // Excel numeric date code to JS Date
          reportDate = new Date((rawDateValue - 25569) * 86400 * 1000);
        } else {
          // Attempt to parse string
          reportDate = new Date(rawDateValue);
        }

        if (isNaN(reportDate.getTime())) {
          throw new Error("Invalid date format in cell S12.");
        }

        // Apply -1 day offset as requested
        const finalDateObj = new Date(reportDate);
        finalDateObj.setDate(finalDateObj.getDate());
        const finalDateStr = finalDateObj.toISOString().split('T')[0];

        // Mapping coordinates provided by user
        const MAPPINGS = [
          { name: 'তিতাস ফিল্ড', gas: 'B43', cond: 'D16', water: 'D25' },
          { name: 'বাখরাবাদ ফিল্ড', gas: 'G43', cond: 'I16', water: 'I25' },
          { name: 'নরসিংদী ফিল্ড', gas: 'L43', cond: 'N16', water: 'N25' },
          { name: 'মেঘনা ফিল্ড', gas: 'O43', cond: 'Q16', water: 'Q25' },
          { name: 'কামতা ফিল্ড', gas: 'S43', cond: 'U16', water: 'U25' },
        ];

        let importCount = 0;
        let skipCount = 0;

        for (const mapping of MAPPINGS) {
          const gasValue = getNumericValue(mapping.gas);
          
          // Import if gas production is recorded
          if (gasValue > 0) {
            // Check for existing records to prevent duplicates on the same date
            const exists = productionData.some(r => r.field === mapping.name && r.date === finalDateStr);
            
            if (!exists) {
              await onAddProduction({
                field: mapping.name,
                amount: gasValue,
                condensate: getNumericValue(mapping.cond),
                water: getNumericValue(mapping.water),
                date: finalDateStr
              });
              importCount++;
            } else {
              skipCount++;
            }
          }
        }

        if (importCount > 0) {
          setSuccessMsg(`Import successful for ${formatDisplayDate(finalDateStr)}. Added ${importCount} records.${skipCount > 0 ? ` Skipped ${skipCount} existing entries.` : ''}`);
        } else if (skipCount > 0) {
          setValidationError(`All records for ${formatDisplayDate(finalDateStr)} already exist in the system.`);
        } else {
          setValidationError("No valid production data found in the mapped cells.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        console.error(err);
        setValidationError(`Import failed: ${err.message || "Ensure the file matches the expected report format."}`);
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePersonnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMsg(null);
    const numOff = Number(officers);
    const numEmp = Number(employees);
    const numAppOff = Number(appOfficers);
    const numAppEmp = Number(appEmployees);
    
    if (isNaN(numOff) || isNaN(numEmp) || isNaN(numAppOff) || isNaN(numAppEmp)) { 
      setValidationError("Enter valid personnel counts."); return; 
    }
    
    if (personnelData.some(p => p.date === persDate && p.id !== editingPersId)) {
       setValidationError(`Personnel data for ${formatDisplayDate(persDate)} already exists.`); return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        date: persDate, 
        officers: numOff, 
        employees: numEmp,
        approved_officers: numAppOff,
        approved_employees: numAppEmp
      };
      
      if (editingPersId) await onUpdatePersonnel(editingPersId, payload);
      else await onAddPersonnel(payload);
      
      setOfficers(''); setEmployees(''); 
      setEditingPersId(null);
      setSuccessMsg("Personnel census updated successfully.");
    } catch { setValidationError("Personnel database update failed."); } finally { setIsSubmitting(false); }
  };

  const startEditProd = (record: ProductionRecord) => {
    setField(record.field); 
    setAmount(record.amount.toString()); 
    setCondensate(record.condensate?.toString() || '');
    setWater(record.water?.toString() || '');
    setProdDate(record.date);
    setEditingProdId(record.id); setValidationError(null); setSuccessMsg(null); setActiveTab('production');
  };

  const startEditPers = (record: PersonnelRecord) => {
    setPersDate(record.date); 
    setOfficers(record.officers.toString()); 
    setEmployees(record.employees.toString());
    setAppOfficers((record.approved_officers || ORGANOGRAM.OFFICERS).toString());
    setAppEmployees((record.approved_employees || ORGANOGRAM.EMPLOYEES).toString());
    setEditingPersId(record.id); setValidationError(null); setSuccessMsg(null); setActiveTab('personnel');
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
          <button onClick={() => { setActiveTab('production'); setValidationError(null); setSuccessMsg(null); setCurrentPage(1); }} className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'production' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
            <LayoutGrid size={16} /> Production
          </button>
          <button onClick={() => { setActiveTab('personnel'); setValidationError(null); setSuccessMsg(null); setCurrentPage(1); }} className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl flex items-center justify-center gap-2 font-bold text-xs md:text-sm transition-all ${activeTab === 'personnel' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>
            <UserCheck size={16} /> Personnel
          </button>
        </div>

        {/* Tab Specific Panel */}
        <div className={`bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300 ${activeTab === 'personnel' ? 'ring-2 ring-amber-500/20' : 'ring-2 ring-emerald-500/20'}`}>
          <h2 className="text-xl md:text-2xl font-black mb-6 flex items-center gap-2 md:gap-3 text-slate-900 dark:text-white">
            {activeTab === 'production' ? <><Database className="text-emerald-500" size={20} /> Field Logging</> : <><Users className="text-amber-500" size={20} /> Census Update</>}
          </h2>

          {validationError && <div className="mb-6 p-3 md:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-[10px] md:text-sm font-bold"><XCircle size={16} /> {validationError}</div>}
          {successMsg && <div className="mb-6 p-3 md:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-[10px] md:text-sm font-bold"><CheckCircle2 size={16} /> {successMsg}</div>}
          
          {activeTab === 'production' ? (
            <div className="space-y-8">
              {/* Excel Import Utility */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl group transition-all hover:border-emerald-500/50">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-emerald-600 dark:text-emerald-500 group-hover:scale-110 transition-transform">
                    {isImporting ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                  </div>
                  <div>
                    <h4 className="text-[10px] md:text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-widest">Excel Report Importer</h4>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-bold mt-1">S12 (Date -1) • Specific Cell Mapping</p>
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    Select Excel File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileImport}
                    accept=".xlsx, .xls"
                    className="hidden" 
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase font-black text-slate-400 bg-white dark:bg-slate-800 px-2 tracking-widest">OR MANUAL ENTRY</div>
              </div>

              <form onSubmit={handleProductionSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Field Selection</label>
                  <select value={field} onChange={(e) => setField(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                    {FIELDS.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Gas (MCF)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Log Date</label>
                    <input type="date" value={prodDate} onChange={(e) => setProdDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Condensate (BBL)</label>
                    <input type="number" step="0.01" value={condensate} onChange={(e) => setCondensate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Water (BBL)</label>
                    <input type="number" step="0.01" value={water} onChange={(e) => setWater(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 md:py-5 rounded-xl md:rounded-2xl text-white font-black uppercase tracking-widest text-xs md:text-sm shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingProdId ? <Save size={16} /> : <PlusCircle size={16} />} {editingProdId ? "Apply Update" : "Push Log"}</button>
                {editingProdId && <button type="button" onClick={() => { setEditingProdId(null); setValidationError(null); setSuccessMsg(null); }} className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-slate-200 rounded-xl">Cancel</button>}
              </form>
            </div>
          ) : (
            <form onSubmit={handlePersonnelSubmit} className="space-y-5 md:space-y-6">
              <div>
                <label className="block text-[8px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Census Date</label>
                <input type="date" value={persDate} onChange={(e) => setPersDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500" required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-emerald-500 uppercase tracking-widest">Present Strength</span>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Officers</label>
                    <input type="number" value={officers} onChange={(e) => setOfficers(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Staff</label>
                    <input type="number" value={employees} onChange={(e) => setEmployees(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500" required />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest">Approved (Organogram)</span>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Officers</label>
                    <input type="number" value={appOfficers} onChange={(e) => setAppOfficers(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black text-slate-400 uppercase mb-1">Staff</label>
                    <input type="number" value={appEmployees} onChange={(e) => setAppEmployees(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs md:text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full bg-amber-600 hover:bg-amber-500 py-4 md:py-5 rounded-xl md:rounded-2xl text-white font-black uppercase tracking-widest text-xs md:text-sm shadow-xl flex items-center justify-center gap-3">{isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingPersId ? <Save size={16} /> : <UserCheck size={16} />} {editingPersId ? "Update Census" : "Submit Census"}</button>
              {editingPersId && <button type="button" onClick={() => { setEditingPersId(null); setValidationError(null); setSuccessMsg(null); }} className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest border border-slate-200 rounded-xl">Cancel</button>}
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
                      <div>
                        <div className="font-black text-sm md:text-lg text-slate-800 dark:text-slate-100">{record.field}</div>
                        <div className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> {formatDisplayDate(record.date)}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[7px] bg-blue-500/10 text-blue-500 px-1 rounded">C: {record.condensate || 0}</span>
                          <span className="text-[7px] bg-amber-500/10 text-amber-500 px-1 rounded">W: {record.water || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                      <div className="text-right">
                        <div className="text-lg md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{record.amount.toLocaleString()}</div>
                        <div className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">MCF</div>
                      </div>
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
                     <div><div className="font-black text-sm md:text-lg text-slate-800 dark:text-slate-100">Census</div><div className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> {formatDisplayDate(record.date)}</div></div>
                   </div>
                   <div className="flex items-center gap-4 md:gap-10">
                     <div className="flex items-center gap-4 md:gap-6">
                        <div className="text-right">
                          <div className="text-base md:text-xl font-black text-amber-600 dark:text-amber-500 font-mono">{record.officers}</div>
                          <div className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">OFF ({record.approved_officers || 'N/A'})</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base md:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{record.employees}</div>
                          <div className="text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">STAFF ({record.approved_employees || 'N/A'})</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 md:gap-2">
                       <button onClick={() => startEditPers(record)} className="p-1.5 md:p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-400/10 rounded-lg"><Edit3 size={16} /></button>
                       <button onClick={async () => { if(confirm("Delete census?")) { setLoadingActionId(record.id); await onDeletePersonnel(record.id); setLoadingActionId(null); } }} className="p-1.5 md:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-400/10 rounded-lg">{loadingActionId === record.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}</button>
                     </div>
                   </div>
                </div>
              ))
            )}
            {pagedData.length === 0 && <div className="text-center py-24 md:py-40 text-slate-400 dark:text-slate-600 flex flex-col items-center gap-4"><AlertCircle size={32} className="opacity-10 md:w-16 md:h-16" /><p className="font-black uppercase tracking-widest text-xs md:text-sm">Empty State</p></div>}
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
