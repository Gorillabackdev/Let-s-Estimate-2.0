import React, { useState, useRef, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  FileText, 
  Clipboard, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Plus, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  Layers, 
  Building2, 
  Filter, 
  Calculator, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  Search
} from 'lucide-react';
import { Project, BoqItem, BESMM4_SECTIONS, QsVerificationStatus } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { FormattedNumberInput } from '../common/FormattedNumberInput';
import { ALL_NIGERIAN_STATES } from '../../data/nigerianLocations';
import { 
  parseBoqFile, 
  parsePastedBoqText, 
  downloadBoqTemplate, 
  getSampleNigerianBoq, 
  ColumnMapping, 
  extractBoqItemsFromRows, 
  extractAllSheetsItems,
  detectHeaderAndColumns,
  categorizeBesmm4Section, 
  isNonMeasurementRow, 
  normalizeUnit 
} from '../../utils/boqImportParser';

interface BoqImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: Project | null;
  projects?: Project[];
  onImportToProject?: (targetProjectId: string, items: BoqItem[], mode: 'replace' | 'append') => Promise<void> | void;
  onCreateProjectWithBoq?: (projectData: Partial<Project>, items: BoqItem[]) => Promise<void> | void;
}

type ImportSourceTab = 'file' | 'paste' | 'sample';

export const BoqImportModal: React.FC<BoqImportModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  projects = [],
  onImportToProject,
  onCreateProjectWithBoq,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<ImportSourceTab>('file');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload State
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rawSheets, setRawSheets] = useState<Record<string, any[][]>>({});
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(0);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    itemNumberCol: -1,
    sectionCol: -1,
    itemCol: -1,
    descriptionCol: -1,
    unitCol: -1,
    qtyCol: -1,
    rateCol: -1,
    amountCol: -1,
  });

  // Pasted Text State
  const [pastedText, setPastedText] = useState('');

  // Review Stage & Items
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [reviewedItems, setReviewedItems] = useState<BoqItem[]>([]);
  const [combinedAllSheetsItems, setCombinedAllSheetsItems] = useState<BoqItem[]>([]);
  const [sheetItemCounts, setSheetItemCounts] = useState<Record<string, number>>({});
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  // Search & Pagination for 500+ Items BOQ
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  // Filter in Review table
  const [filterSection, setFilterSection] = useState<string>('All');
  const [filterRateStatus, setFilterRateStatus] = useState<'all' | 'priced' | 'unpriced'>('all');

  // Destination Configuration
  const [destinationMode, setDestinationMode] = useState<'current' | 'new' | 'existing'>(
    activeProject && activeProject.id ? 'current' : 'new'
  );
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [selectedExistingProjectId, setSelectedExistingProjectId] = useState<string>(
    activeProject?.id || (projects.length > 0 ? projects[0].id : '')
  );

  // New Project Form (if destinationMode === 'new')
  const [newProjectTitle, setNewProjectTitle] = useState('Imported Bill of Quantities');
  const [newProjectLocation, setNewProjectLocation] = useState('Lagos');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectPoPercent, setNewProjectPoPercent] = useState(15);
  const [newProjectVatPercent, setNewProjectVatPercent] = useState(7.5);
  const [newProjectSwampPercent, setNewProjectSwampPercent] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await parseBoqFile(file);
      setSelectedFileName(result.fileName || file.name);
      setSheetNames(result.sheetNames);
      setActiveSheetName(result.activeSheet);
      setRawSheets(result.allSheets);
      setSheetHeaders(result.headers);
      setHeaderRowIdx(result.headerRowIndex);
      setColumnMapping(result.mapping);
      setReviewedItems(result.items);
      setCombinedAllSheetsItems(result.combinedAllSheetsItems || result.items);
      setSheetItemCounts(result.sheetItemCounts || {});
      setSearchQuery('');
      setCurrentPage(1);
      setNewProjectTitle((file.name.replace(/\.[^/.]+$/, '') || 'Imported BOQ') + ' (Reviewed)');

      if (result.items.length === 0) {
        setShowColumnConfig(true);
        setErrorMessage(
          `Worksheet "${result.activeSheet}" loaded (${result.rawRowsCount} rows), but line items could not be identified automatically. Please choose your Header Row and map the columns below.`
        );
      }

      setStep('review');
    } catch (err: any) {
      console.error('BOQ parse error:', err);
      setErrorMessage(err.message || 'Failed to read file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Switching to "All Sheets (Combined BOQ)"
  const handleSelectAllSheets = () => {
    setActiveSheetName('__ALL_SHEETS__');
    setCurrentPage(1);
    if (combinedAllSheetsItems.length > 0) {
      setReviewedItems(combinedAllSheetsItems);
      setErrorMessage(null);
    } else {
      const { allItems, sheetItemCounts: counts } = extractAllSheetsItems(rawSheets, sheetNames);
      setCombinedAllSheetsItems(allItems);
      setSheetItemCounts(counts);
      setReviewedItems(allItems);
      setErrorMessage(null);
    }
  };

  // Handle Single Sheet Selection
  const handleSelectSheet = (sheetName: string) => {
    setActiveSheetName(sheetName);
    setCurrentPage(1);
    const rows = rawSheets[sheetName] || [];
    if (rows.length === 0) {
      setReviewedItems([]);
      return;
    }
    const detection = detectHeaderAndColumns(rows);
    setHeaderRowIdx(detection.headerIndex);
    setSheetHeaders(detection.headers);
    setColumnMapping(detection.mapping);
    const reExtracted = extractBoqItemsFromRows(rows, detection.headerIndex, detection.mapping, 'Imported', sheetName);
    setReviewedItems(reExtracted);
    if (reExtracted.length === 0) {
      setShowColumnConfig(true);
      setErrorMessage(`No measurement items detected on sheet "${sheetName}". Please adjust the Header Row or Column Mapping below.`);
    } else {
      setErrorMessage(null);
    }
  };

  // Handle Header Row Selection Change
  const handleHeaderRowChange = (newHeaderIdx: number) => {
    setHeaderRowIdx(newHeaderIdx);
    const targetSheet = activeSheetName === '__ALL_SHEETS__' ? sheetNames[0] : activeSheetName;
    const rows = rawSheets[targetSheet] || [];
    if (rows.length === 0) return;
    const newHeaders = (rows[newHeaderIdx] || []).map((h, i) => String(h || `Column ${i + 1}`).trim());
    setSheetHeaders(newHeaders);
    const reExtracted = extractBoqItemsFromRows(rows, newHeaderIdx, columnMapping, 'Imported', targetSheet);
    setReviewedItems(reExtracted);
    if (reExtracted.length > 0) {
      setErrorMessage(null);
    }
  };

  // Handle Re-parse when mapping changes
  const handleReapplyMapping = (newMapping: ColumnMapping) => {
    setColumnMapping(newMapping);
    const targetSheet = activeSheetName === '__ALL_SHEETS__' ? sheetNames[0] : activeSheetName;
    const rows = rawSheets[targetSheet] || [];
    if (rows.length > 0) {
      const reExtracted = extractBoqItemsFromRows(rows, headerRowIdx, newMapping, 'Imported', targetSheet);
      setReviewedItems(reExtracted);
      if (reExtracted.length > 0) {
        setErrorMessage(null);
      }
    }
  };

  // Handle Pasted Text Parsing
  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste tabular rows copied from your spreadsheet.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = parsePastedBoqText(pastedText);
      setSelectedFileName('Pasted Clipboard BOQ');
      setSheetNames(['Pasted']);
      setActiveSheetName('Pasted');
      setRawSheets(result.allSheets);
      setSheetHeaders(result.headers);
      setHeaderRowIdx(result.headerRowIndex);
      setColumnMapping(result.mapping);
      setReviewedItems(result.items);
      setNewProjectTitle('Pasted Bill of Quantities ' + new Date().toLocaleDateString('en-GB'));
      if (result.items.length === 0) {
        setShowColumnConfig(true);
        setErrorMessage('Pasted rows loaded, but no measurement columns were recognized automatically. Please map the columns below.');
      }
      setStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse pasted text.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Sample 1-Click Load
  const handleLoadSample = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const sample = getSampleNigerianBoq();
      setSelectedFileName('Standard_Nigerian_2Storey_Duplex_Sample.xlsx');
      setReviewedItems(sample);
      setNewProjectTitle('Sample 4-Bedroom Duplex BOQ (Reviewed)');
      setNewProjectLocation('Lagos');
      setStep('review');
      setIsProcessing(false);
    }, 200);
  };

  // Table In-line Edits
  const handleUpdateItem = (id: string, field: keyof BoqItem, val: any) => {
    setReviewedItems(prev => {
      return prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        if (field === 'qty' || field === 'rate') {
          const q = field === 'qty' ? Number(val || 0) : updated.qty;
          const r = field === 'rate' ? Number(val || 0) : updated.rate;
          updated.amount = Math.round(q * r);
        }
        return updated;
      });
    });
  };

  // Remove Row
  const handleDeleteRow = (id: string) => {
    setReviewedItems(prev => prev.filter(it => it.id !== id));
  };

  // Prune Subtotal / Non-Measurement Rows
  const handlePruneNonMeasurementRows = () => {
    setReviewedItems(prev => {
      const filtered = prev.filter(it => !isNonMeasurementRow(it.description, it.item, it.unit, it.qty));
      return filtered.map((it, idx) => ({ ...it, item_number: idx + 1 }));
    });
  };

  // Auto-fill Missing BESMM4 Sections
  const handleAutoCategorizeSections = () => {
    setReviewedItems(prev => {
      return prev.map(it => {
        if (!it.section || it.section === 'General' || it.section === 'Uncategorized') {
          return { ...it, section: categorizeBesmm4Section(it.description, it.item) };
        }
        return it;
      });
    });
  };

  // Auto-populate ₦0 rates with Nigerian benchmarks
  const handleAutoPopulateMarketRates = () => {
    const benchmarks: Record<string, number> = {
      'Substructure': 85000,
      'Reinforced Concrete Frame': 115000,
      'Blockwork & Partitioning': 13500,
      'Roofing & Rainwater Goods': 14800,
      'Carpentry & Joinery': 45000,
      'Finishes (Plastering, Tiling & Painting)': 18500,
      'Doors & Windows': 75000,
      'Mechanical & Plumbing Installations': 165000,
      'Electrical & IT Installations': 14500,
      'External Works & Drainage': 12500,
      'Preliminaries & General Items': 500000,
      'Provisional Sums & Contingencies': 1000000,
    };

    setReviewedItems(prev => {
      return prev.map(it => {
        if (it.rate === 0) {
          const bench = benchmarks[it.section || ''] || 15000;
          return {
            ...it,
            rate: bench,
            amount: Math.round(it.qty * bench),
            verification_status: 'AI Suggested',
          };
        }
        return it;
      });
    });
  };

  // Add Empty Row to the top or bottom of review table
  const handleAddEmptyRow = () => {
    const newNum = reviewedItems.length + 1;
    const newItem: BoqItem = {
      id: `manual-new-${Date.now()}-${newNum}`,
      item_number: newNum,
      item_code: `${newNum}`,
      section: filterSection !== 'All' ? filterSection : 'Substructure',
      item: 'New Line Item',
      description: 'Specification description of measurement works',
      unit: 'm2',
      qty: 1,
      rate: 0,
      amount: 0,
      source: 'MANUAL_ENTRY',
      verification_status: 'QS Verified',
    };
    setReviewedItems(prev => [newItem, ...prev]);
  };

  // Metrics calculation
  const totalItemsCount = reviewedItems.length;
  const totalSubtotal = useMemo(() => {
    return reviewedItems.reduce((acc, it) => acc + (Number(it.amount) || (Number(it.qty || 0) * Number(it.rate || 0))), 0);
  }, [reviewedItems]);
  const unpricedCount = useMemo(() => {
    return reviewedItems.filter(it => !it.rate || it.rate === 0).length;
  }, [reviewedItems]);

  // Filtered view items with search support
  const displayItems = useMemo(() => {
    return reviewedItems.filter(it => {
      if (filterSection !== 'All' && it.section !== filterSection) return false;
      if (filterRateStatus === 'priced' && (!it.rate || it.rate === 0)) return false;
      if (filterRateStatus === 'unpriced' && it.rate && it.rate > 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (it.description && it.description.toLowerCase().includes(q)) ||
          (it.item && it.item.toLowerCase().includes(q)) ||
          (it.item_code && it.item_code.toLowerCase().includes(q)) ||
          (it.section && it.section.toLowerCase().includes(q)) ||
          (it.unit && it.unit.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [reviewedItems, filterSection, filterRateStatus, searchQuery]);

  const totalPages = itemsPerPage === -1 ? 1 : Math.max(1, Math.ceil(displayItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    if (itemsPerPage === -1) return displayItems;
    const start = (currentPage - 1) * itemsPerPage;
    return displayItems.slice(start, start + itemsPerPage);
  }, [displayItems, currentPage, itemsPerPage]);

  // Final Submit Handler
  const handleConfirmImport = async () => {
    if (reviewedItems.length === 0) {
      setErrorMessage('Cannot import an empty list of items.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (destinationMode === 'current' && activeProject?.id) {
        if (onImportToProject) {
          await onImportToProject(activeProject.id, reviewedItems, importMode);
        }
      } else if (destinationMode === 'existing' && selectedExistingProjectId) {
        if (onImportToProject) {
          await onImportToProject(selectedExistingProjectId, reviewedItems, importMode);
        }
      } else if (destinationMode === 'new') {
        if (onCreateProjectWithBoq) {
          await onCreateProjectWithBoq(
            {
              title: newProjectTitle.trim() || 'Imported Bill of Quantities',
              location: newProjectLocation,
              client_name: newProjectClient.trim() || 'Client Project',
              po_percent: newProjectPoPercent,
              vat_percent: newProjectVatPercent,
              swamp_premium_percent: newProjectSwampPercent,
              status: 'In Progress',
            },
            reviewedItems
          );
        }
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to commit imported BOQ:', err);
      setErrorMessage(err.message || 'Failed to import BOQ to project.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="boq-import-modal-overlay" 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div 
        id="boq-import-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800/90 border border-emerald-700/60 flex items-center justify-center text-emerald-200 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Import Bill of Quantities (BOQ) for Manual Review
                </h2>
                <span className="bg-emerald-800 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700 uppercase">
                  BESMM4 / NIQS
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Load external Excel (.xlsx), CSV or clipboard tables, verify trade columns, and manually review rates before committing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-600 hover:text-rose-900 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: UPLOAD / SOURCE SELECTION */}
          {/* ========================================================================= */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Source Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveSourceTab('file')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeSourceTab === 'file'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Spreadsheet File (.xlsx, .csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSourceTab('paste')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeSourceTab === 'paste'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Spreadsheet Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSourceTab('sample')}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeSourceTab === 'sample'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>1-Click Nigerian Demo BOQ</span>
                </button>
              </div>

              {/* TAB 1: FILE UPLOAD */}
              {activeSourceTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl p-8 sm:p-12 text-center bg-emerald-50/40 hover:bg-emerald-50/80 transition cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                      Click to choose or drag &amp; drop your BOQ spreadsheet
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Supports Excel workbooks (<strong>.xlsx, .xls</strong>), Comma-Separated Values (<strong>.csv</strong>), Tab-Delimited (<strong>.tsv</strong>), or JSON files.
                    </p>

                    <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Browse Files</span>
                    </div>
                  </div>

                  {/* Template download helper */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">Need a standard Nigerian BOQ template?</span>
                      <span className="text-slate-500">
                        Download pre-formatted templates matching BESMM4 trades with sample formulas.
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => downloadBoqTemplate('xlsx')}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Download Excel (.xlsx)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadBoqTemplate('csv')}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold shadow-2xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PASTE DATA */}
              {activeSourceTab === 'paste' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <p className="font-bold text-slate-800 mb-1">How to paste from Excel or Google Sheets:</p>
                    <p>
                      1. Open your BOQ in Microsoft Excel, Google Sheets, or Word. <br />
                      2. Select the rows including columns like <em>Item, Description, Unit, Qty, Rate, Amount</em> and press <strong>Ctrl+C</strong>. <br />
                      3. Paste directly into the box below and click <strong>&quot;Parse &amp; Review Manually&quot;</strong>.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste copied tabular rows here... Example:
1.1	Substructure	Excavate foundation trenches	m3	48	3800	182400
1.2	Substructure	Consolidated hardcore bed	m2	140	4500	630000
2.1	RC Frame	Grade 25 in floor beams	m3	16	120000	1920000"
                    className="w-full font-mono text-xs p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white text-slate-800"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePastedText}
                      disabled={isProcessing || !pastedText.trim()}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Parse &amp; Review Manually</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SAMPLE 1-CLICK DEMO */}
              {activeSourceTab === 'sample' && (
                <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-4 text-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Standard 4-Bedroom Duplex Nigerian BOQ</h4>
                      <p className="text-slate-600 mt-1">
                        Load 26 fully priced, professional BESMM4 measurement line items covering Substructure, Concrete Frame, Sandcrete Blockwork, Aluminium Longspan Roof, Finishes, Mechanical &amp; Electrical services.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[11px]">Trade Scope</span>
                      <strong className="text-slate-900">Full Structural &amp; Services</strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[11px]">Rate Standards</span>
                      <strong className="text-slate-900">Lagos Current 2026 Rates</strong>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-200">
                      <span className="text-slate-500 block text-[11px]">Item Count</span>
                      <strong className="text-slate-900">26 BESMM4 Line Items</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      disabled={isProcessing}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Load Sample &amp; Review Manually</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: INTERACTIVE PRE-IMPORT MANUAL REVIEW */}
          {/* ========================================================================= */}
          {step === 'review' && (
            <div className="space-y-5">
              
              {/* Review Overview Bar & Sheet Selector */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {selectedFileName || 'Imported BOQ'}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {totalItemsCount} Valid Items
                    </span>
                    {unpricedCount > 0 && (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {unpricedCount} Zero Rate Items
                      </span>
                    )}
                  </div>

                  {sheetNames.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500 font-semibold shrink-0">Worksheet:</span>
                      <div className="flex flex-wrap gap-1 items-center">
                        <button
                          type="button"
                          onClick={handleSelectAllSheets}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                            activeSheetName === '__ALL_SHEETS__'
                              ? 'bg-emerald-800 text-white shadow-2xs'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <span>All Sheets</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            activeSheetName === '__ALL_SHEETS__' ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-200 text-emerald-900'
                          }`}>
                            {combinedAllSheetsItems.length || totalItemsCount}
                          </span>
                        </button>

                        {sheetNames.map((sName) => {
                          const count = sheetItemCounts[sName];
                          return (
                            <button
                              key={sName}
                              type="button"
                              onClick={() => handleSelectSheet(sName)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                                activeSheetName === sName
                                  ? 'bg-slate-800 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <span>{sName}</span>
                              {count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                  activeSheetName === sName ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Cost Value Summary */}
                <div className="flex items-center space-x-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Calculated Total Bill Value
                    </span>
                    <span className="text-base font-extrabold text-emerald-800">
                      {formatNaira(totalSubtotal)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowColumnConfig(!showColumnConfig)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    <span>Column Mapping</span>
                    {showColumnConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Column Mapping Bar */}
              {showColumnConfig && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-slate-800">Column Auto-Detection &amp; Overrides</span>
                      <span className="text-slate-500 text-[11px] block sm:inline sm:ml-2">Select which column in your sheet corresponds to each field:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-bold text-slate-600">Header Row:</span>
                      <select
                        value={headerRowIdx}
                        onChange={(e) => handleHeaderRowChange(Number(e.target.value))}
                        className="p-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                      >
                        {(rawSheets[activeSheetName] || []).slice(0, 30).map((row, rIdx) => {
                          const snippet = (row || []).filter(Boolean).slice(0, 3).join(' | ');
                          return (
                            <option key={rIdx} value={rIdx}>
                              Row {rIdx + 1}: {snippet ? snippet.substring(0, 35) + '...' : '(empty)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Item No / S/N</label>
                      <select
                        value={columnMapping.itemNumberCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, itemNumberCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- Ignore / Auto --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Trade / Section</label>
                      <select
                        value={columnMapping.sectionCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, sectionCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- Auto BESMM4 --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Description / Spec</label>
                      <select
                        value={columnMapping.descriptionCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, descriptionCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- None --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Unit of Measure</label>
                      <select
                        value={columnMapping.unitCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, unitCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- None --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Quantity</label>
                      <select
                        value={columnMapping.qtyCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, qtyCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- None --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Unit Rate (₦)</label>
                      <select
                        value={columnMapping.rateCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, rateCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- None --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Amount (₦)</label>
                      <select
                        value={columnMapping.amountCol}
                        onChange={(e) => handleReapplyMapping({ ...columnMapping, amountCol: Number(e.target.value) })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      >
                        <option value="-1">-- Calculate Qty * Rate --</option>
                        {sheetHeaders.map((h, i) => (
                          <option key={i} value={i}>Col {i + 1}: {h}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Filter & Action Toolbar */}
              <div className="flex flex-col gap-2.5 text-xs border-b border-slate-200 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[240px] max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search items, specs, or codes..."
                      className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-700"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Sanitation & Rate Utilities */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePruneNonMeasurementRows}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold cursor-pointer shadow-2xs"
                      title="Remove collection headers, page totals and subtotal rows"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Prune Subtotals</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoCategorizeSections}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold cursor-pointer shadow-2xs"
                      title="Auto-classify any missing trade sections into standard BESMM4 trades"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Auto-Assign BESMM4</span>
                    </button>

                    {unpricedCount > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoPopulateMarketRates}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
                        title="Apply default Nigerian market rates to zero-priced items"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Benchmark {unpricedCount} Unpriced</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleAddEmptyRow}
                      className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Section filter pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterSection('All');
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      filterSection === 'All'
                        ? 'bg-emerald-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All Sections ({reviewedItems.length})
                  </button>

                  {BESMM4_SECTIONS.map((sec) => {
                    const count = reviewedItems.filter(i => i.section === sec).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setFilterSection(sec);
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          filterSection === sec
                            ? 'bg-emerald-800 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {sec.split(' ')[0]} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Manual Review Table Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="max-h-[440px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3 w-48">BESMM4 Section</th>
                        <th className="py-2.5 px-3">Description &amp; Technical Spec</th>
                        <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                        <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                        <th className="py-2.5 px-3 w-28 text-right">Rate (₦)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Amount (₦)</th>
                        <th className="py-2.5 px-3 w-28 text-center">QS Status</th>
                        <th className="py-2.5 px-3 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedItems.map((item, index) => {
                        const isUnpriced = !item.rate || item.rate === 0;

                        return (
                          <tr 
                            key={item.id || index}
                            className={`hover:bg-slate-50 transition ${isUnpriced ? 'bg-amber-50/30' : ''}`}
                          >
                            {/* Row number */}
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {item.item_number || (itemsPerPage === -1 ? index + 1 : (currentPage - 1) * itemsPerPage + index + 1)}
                            </td>

                            {/* Section Dropdown */}
                            <td className="py-2 px-3">
                              <select
                                value={item.section}
                                onChange={(e) => handleUpdateItem(item.id, 'section', e.target.value)}
                                className="w-full text-[11px] p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded font-semibold text-slate-800"
                              >
                                {BESMM4_SECTIONS.map((sec) => (
                                  <option key={sec} value={sec}>{sec}</option>
                                ))}
                              </select>
                            </td>

                            {/* Description Input */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                className="w-full text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 rounded text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Unit Input */}
                            <td className="py-2 px-3 text-center">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, 'unit', normalizeUnit(e.target.value))}
                                className="w-16 text-center text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 rounded font-mono font-medium text-slate-700 focus:bg-white"
                              />
                            </td>

                            {/* Quantity Input */}
                            <td className="py-2 px-3 text-right">
                              <FormattedNumberInput
                                value={item.qty || ''}
                                onChange={(val) => handleUpdateItem(item.id, 'qty', val)}
                                maxDecimals={2}
                                placeholder="0"
                                className="w-20 text-right text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-300 rounded font-mono font-medium text-slate-900 focus:bg-white"
                              />
                            </td>

                            {/* Unit Rate Input */}
                            <td className="py-2 px-3 text-right">
                              <FormattedNumberInput
                                value={item.rate || ''}
                                onChange={(val) => handleUpdateItem(item.id, 'rate', val)}
                                maxDecimals={2}
                                className={`w-24 text-right text-xs p-1 rounded font-mono font-semibold focus:bg-white ${
                                  isUnpriced 
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                    : 'bg-transparent hover:bg-white border border-transparent hover:border-slate-300 text-emerald-800'
                                }`}
                                placeholder="0"
                              />
                            </td>

                            {/* Amount */}
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatNaira(item.amount)}
                            </td>

                            {/* Status */}
                            <td className="py-2 px-3 text-center">
                              <select
                                value={item.verification_status || 'Imported'}
                                onChange={(e) => handleUpdateItem(item.id, 'verification_status', e.target.value as QsVerificationStatus)}
                                className="text-[10px] font-bold p-1 rounded bg-slate-100 border-none text-slate-700"
                              >
                                <option value="Imported">Imported</option>
                                <option value="QS Verified">QS Verified</option>
                                <option value="Requires Verification">Needs Check</option>
                                <option value="AI Suggested">AI Suggested</option>
                              </select>
                            </td>

                            {/* Delete */}
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Delete row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {displayItems.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 px-4 text-center">
                            <div className="max-w-md mx-auto space-y-3">
                              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-5 h-5" />
                              </div>
                              {searchQuery.trim() ? (
                                <>
                                  <p className="font-semibold text-slate-800 text-sm">
                                    No items match &quot;{searchQuery}&quot;
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    Try searching with a different term or clear the search filter.
                                  </p>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                      }}
                                      className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                                    >
                                      Clear Search Filter
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold text-slate-800 text-sm">
                                    No line items found on worksheet &quot;{activeSheetName}&quot;
                                  </p>
                                  <p className="text-slate-500 text-xs leading-relaxed">
                                    This sheet may begin lower down or use custom headings. You can use the <strong>Header Row</strong> and <strong>Column Mapping</strong> bar above to map your columns, or add line items manually.
                                  </p>
                                  <div className="flex items-center justify-center gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setShowColumnConfig(true)}
                                      className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
                                    >
                                      Configure Columns &amp; Header Row
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleAddEmptyRow}
                                      className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                                    >
                                      Add Manual Item
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Large 500+ Item BOQs */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing{' '}
                      <strong>
                        {displayItems.length === 0
                          ? 0
                          : itemsPerPage === -1
                          ? 1
                          : (currentPage - 1) * itemsPerPage + 1}
                      </strong>{' '}
                      to{' '}
                      <strong>
                        {itemsPerPage === -1
                          ? displayItems.length
                          : Math.min(currentPage * itemsPerPage, displayItems.length)}
                      </strong>{' '}
                      of <strong>{displayItems.length}</strong> items
                      {reviewedItems.length !== displayItems.length && (
                        <span className="text-slate-400 ml-1">(filtered from {reviewedItems.length} total)</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-500 font-medium">Page size:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="p-1 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-700 shadow-2xs"
                      >
                        <option value={25}>25 items</option>
                        <option value={50}>50 items</option>
                        <option value={100}>100 items</option>
                        <option value={200}>200 items</option>
                        <option value={-1}>All ({displayItems.length})</option>
                      </select>
                    </div>

                    {itemsPerPage !== -1 && totalPages > 1 && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          disabled={currentPage <= 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-medium text-slate-700">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DESTINATION SELECTION */}
              {/* ========================================================================= */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Import Destination
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Choose how to save these reviewed {reviewedItems.length} items
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Option 1: Current Project (if one is open) */}
                  {activeProject && activeProject.id && (
                    <label 
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        destinationMode === 'current'
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="destination"
                          checked={destinationMode === 'current'}
                          onChange={() => setDestinationMode('current')}
                          className="text-emerald-700 focus:ring-emerald-500"
                        />
                        <strong className="text-slate-900 truncate">Current Active Project</strong>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block truncate">
                        &quot;{activeProject.title}&quot; ({activeProject.items?.length || 0} existing items)
                      </span>
                    </label>
                  )}

                  {/* Option 2: Create New Project */}
                  <label 
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      destinationMode === 'new'
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="destination"
                        checked={destinationMode === 'new'}
                        onChange={() => setDestinationMode('new')}
                        className="text-emerald-700 focus:ring-emerald-500"
                      />
                      <strong className="text-slate-900">Create New Project</strong>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Initialize a brand new estimate with these imported items
                    </span>
                  </label>

                  {/* Option 3: Existing Project from Portfolio */}
                  {projects.length > 0 && (
                    <label 
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        destinationMode === 'existing'
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-white/60 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="destination"
                          checked={destinationMode === 'existing'}
                          onChange={() => setDestinationMode('existing')}
                          className="text-emerald-700 focus:ring-emerald-500"
                        />
                        <strong className="text-slate-900">Select Existing Project</strong>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Choose another project from your portfolio ({projects.length} available)
                      </span>
                    </label>
                  )}
                </div>

                {/* Sub-options for Current or Existing Project (Replace vs Append) */}
                {(destinationMode === 'current' || destinationMode === 'existing') && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {destinationMode === 'existing' && (
                      <div className="flex-1 max-w-sm">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Project:</label>
                        <select
                          value={selectedExistingProjectId}
                          onChange={(e) => setSelectedExistingProjectId(e.target.value)}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                        >
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title} ({p.items?.length || 0} items - {p.location})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <span className="text-slate-600 font-semibold">Mode:</span>
                      <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="text-emerald-700"
                        />
                        <span className="font-semibold text-slate-800">Replace BOQ</span>
                      </label>
                      <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          className="text-emerald-700"
                        />
                        <span className="font-semibold text-slate-800">Append to Existing</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Sub-form for New Project */}
                {destinationMode === 'new' && (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Project Title</label>
                      <input
                        type="text"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        placeholder="e.g. 4-Bedroom Detached Duplex BOQ"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Nigerian State / Location</label>
                      <select
                        value={newProjectLocation}
                        onChange={(e) => setNewProjectLocation(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        {ALL_NIGERIAN_STATES.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Name</label>
                      <input
                        type="text"
                        value={newProjectClient}
                        onChange={(e) => setNewProjectClient(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        placeholder="e.g. Chief Adeleke / Prime Estates"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Profit &amp; Overhead (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={newProjectPoPercent}
                        onChange={(e) => setNewProjectPoPercent(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Swamp Terrain Surcharge (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={newProjectSwampPercent}
                        onChange={(e) => setNewProjectSwampPercent(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        placeholder="0% (Dry) or 15% (Lekki / Swamp)"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200 shrink-0">
          <div>
            {step === 'review' ? (
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change File / Re-upload</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {step === 'review' && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={isProcessing || reviewedItems.length === 0}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>
                  Confirm &amp; Import {reviewedItems.length} Items ({formatNaira(totalSubtotal)})
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
