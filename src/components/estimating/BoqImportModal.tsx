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
  Sliders,
  HelpCircle,
  Search,
  Eye,
  Settings2,
  Table,
  Hash
} from 'lucide-react';
import { Project, BoqItem, BESMM4_SECTIONS } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { FormattedNumberInput } from '../common/FormattedNumberInput';
import { ALL_NIGERIAN_STATES } from '../../data/nigerianLocations';
import { 
  parseBoqFile, 
  parsePastedBoqText, 
  downloadBoqTemplate, 
  getSampleNigerianBoq, 
  ColumnMapping, 
  BoqImportParameters,
  DEFAULT_IMPORT_PARAMETERS,
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
type WorkspaceTab = 'parameters' | 'review';

export const BoqImportModal: React.FC<BoqImportModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  projects = [],
  onImportToProject,
  onCreateProjectWithBoq,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<ImportSourceTab>('file');
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('parameters');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload & Data State
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [rawSheets, setRawSheets] = useState<Record<string, any[][]>>({});
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);

  // Comprehensive BOQ Import Parameters
  const [importParams, setImportParams] = useState<BoqImportParameters>({ ...DEFAULT_IMPORT_PARAMETERS });

  // Pasted Text State
  const [pastedText, setPastedText] = useState('');

  // Items State
  const [step, setStep] = useState<'upload' | 'workspace'>('upload');
  const [reviewedItems, setReviewedItems] = useState<BoqItem[]>([]);
  const [combinedAllSheetsItems, setCombinedAllSheetsItems] = useState<BoqItem[]>([]);
  const [sheetItemCounts, setSheetItemCounts] = useState<Record<string, number>>({});

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

  // Active raw rows for live preview in the parameters tab
  const activeRawRows = useMemo(() => {
    if (!activeSheetName || activeSheetName === '__ALL_SHEETS__') {
      const firstKey = sheetNames[0] || '';
      return rawSheets[firstKey] || [];
    }
    return rawSheets[activeSheetName] || [];
  }, [rawSheets, activeSheetName, sheetNames]);

  // Execute extraction with given parameters
  const runExtraction = (
    sheetName: string,
    params: BoqImportParameters,
    sheetsDict: Record<string, any[][]> = rawSheets,
    allNames: string[] = sheetNames
  ) => {
    if (sheetName === '__ALL_SHEETS__') {
      const { allItems, sheetItemCounts: counts } = extractAllSheetsItems(sheetsDict, allNames, params);
      setCombinedAllSheetsItems(allItems);
      setSheetItemCounts(counts);
      setReviewedItems(allItems);
      return allItems;
    } else {
      const rows = sheetsDict[sheetName] || [];
      const extracted = extractBoqItemsFromRows(
        rows,
        params.headerRowIndex,
        params.mapping,
        'Imported',
        params.defaultSection,
        params
      );
      setReviewedItems(extracted);
      return extracted;
    }
  };

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
      const result = await parseBoqFile(file, importParams);
      setSelectedFileName(result.fileName || file.name);
      setSheetNames(result.sheetNames);
      setActiveSheetName(result.activeSheet);
      setRawSheets(result.allSheets);
      setSheetHeaders(result.headers);

      const newParams: BoqImportParameters = {
        ...importParams,
        headerRowIndex: result.headerRowIndex,
        dataStartRowIndex: result.headerRowIndex + 1,
        mapping: result.mapping,
      };
      setImportParams(newParams);

      setReviewedItems(result.items);
      setCombinedAllSheetsItems(result.combinedAllSheetsItems || result.items);
      setSheetItemCounts(result.sheetItemCounts || {});
      setSearchQuery('');
      setCurrentPage(1);
      setNewProjectTitle((file.name.replace(/\.[^/.]+$/, '') || 'Imported BOQ') + ' (Reviewed)');

      if (result.items.length === 0) {
        setWorkspaceTab('parameters');
        setErrorMessage(
          `Document loaded (${result.rawRowsCount} rows), but line items could not be auto-detected. Use the Parameters & Mapping workspace below to map the columns.`
        );
      } else {
        setWorkspaceTab('review');
      }

      setStep('workspace');
    } catch (err: any) {
      console.error('BOQ parse error:', err);
      setErrorMessage(err.message || 'Failed to read file. Please ensure it is a valid Excel, PDF, CSV, or Text file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Switching to "All Sheets (Combined BOQ)"
  const handleSelectAllSheets = () => {
    setActiveSheetName('__ALL_SHEETS__');
    setCurrentPage(1);
    runExtraction('__ALL_SHEETS__', importParams);
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
    const updatedParams: BoqImportParameters = {
      ...importParams,
      headerRowIndex: detection.headerIndex,
      dataStartRowIndex: detection.headerIndex + 1,
      mapping: detection.mapping,
    };
    setImportParams(updatedParams);
    setSheetHeaders(detection.headers);

    const reExtracted = runExtraction(sheetName, updatedParams);
    if (reExtracted.length === 0) {
      setErrorMessage(`No items detected on "${sheetName}". Please adjust the parameters or column mapping.`);
    } else {
      setErrorMessage(null);
    }
  };

  // Set Header Row directly
  const handleSetHeaderRow = (newHeaderIdx: number) => {
    const targetSheet = activeSheetName === '__ALL_SHEETS__' ? (sheetNames[0] || '') : activeSheetName;
    const rows = rawSheets[targetSheet] || [];
    const newHeaders = (rows[newHeaderIdx] || []).map((h, i) => String(h || `Column ${i + 1}`).trim());
    setSheetHeaders(newHeaders);

    const updatedParams: BoqImportParameters = {
      ...importParams,
      headerRowIndex: newHeaderIdx,
      dataStartRowIndex: Math.max(importParams.dataStartRowIndex, newHeaderIdx + 1),
    };
    setImportParams(updatedParams);
    runExtraction(activeSheetName, updatedParams);
  };

  // Set Data Start Row directly
  const handleSetDataStartRow = (newStartIdx: number) => {
    const updatedParams: BoqImportParameters = {
      ...importParams,
      dataStartRowIndex: newStartIdx,
    };
    setImportParams(updatedParams);
    runExtraction(activeSheetName, updatedParams);
  };

  // Update a single column mapping
  const handleSetColumnRole = (colIdx: number, role: keyof ColumnMapping | 'ignore') => {
    const newMapping: ColumnMapping = { ...importParams.mapping };

    // Clear old assignment for this role if unique
    if (role !== 'ignore') {
      (Object.keys(newMapping) as Array<keyof ColumnMapping>).forEach((key) => {
        if (newMapping[key] === colIdx) {
          newMapping[key] = -1;
        }
      });
      newMapping[role] = colIdx;
    } else {
      // Remove any role pointing to this colIdx
      (Object.keys(newMapping) as Array<keyof ColumnMapping>).forEach((key) => {
        if (newMapping[key] === colIdx) {
          newMapping[key] = -1;
        }
      });
    }

    const updatedParams: BoqImportParameters = {
      ...importParams,
      mapping: newMapping,
    };
    setImportParams(updatedParams);
    runExtraction(activeSheetName, updatedParams);
  };

  // Toggle a parameter switch
  const handleToggleParam = (paramKey: keyof BoqImportParameters) => {
    const updatedParams: BoqImportParameters = {
      ...importParams,
      [paramKey]: !importParams[paramKey],
    };
    setImportParams(updatedParams);
    runExtraction(activeSheetName, updatedParams);
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
      const result = parsePastedBoqText(pastedText, 'Pasted Clipboard BOQ', importParams);
      setSelectedFileName('Pasted Clipboard BOQ');
      setSheetNames(['Pasted Data']);
      setActiveSheetName('Pasted Data');
      setRawSheets(result.allSheets);
      setSheetHeaders(result.headers);

      const updatedParams: BoqImportParameters = {
        ...importParams,
        headerRowIndex: result.headerRowIndex,
        dataStartRowIndex: result.headerRowIndex + 1,
        mapping: result.mapping,
      };
      setImportParams(updatedParams);
      setReviewedItems(result.items);
      setNewProjectTitle('Pasted Bill of Quantities ' + new Date().toLocaleDateString('en-GB'));

      if (result.items.length === 0) {
        setWorkspaceTab('parameters');
        setErrorMessage('Pasted rows loaded, but no measurement columns were recognized. Please map the parameters below.');
      } else {
        setWorkspaceTab('review');
      }
      setStep('workspace');
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
      setWorkspaceTab('review');
      setStep('workspace');
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
          };
        }
        return it;
      });
    });
  };

  // Add Empty Row to the review table
  const handleAddEmptyRow = () => {
    const newNum = reviewedItems.length + 1;
    const newItem: BoqItem = {
      id: `manual-new-${Date.now()}-${newNum}`,
      item_number: newNum,
      item_code: `${newNum}`,
      section: filterSection !== 'All' ? filterSection : importParams.defaultSection,
      item: 'New Line Item',
      description: 'Specification description of measurement works',
      unit: importParams.defaultUnit || 'm2',
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
      setErrorMessage('Cannot import an empty list of items. Please review parameters and make sure items are recognized.');
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

  // Helper to get active mapping role for a column index
  const getColRole = (colIdx: number): string => {
    const m = importParams.mapping;
    if (m.descriptionCol === colIdx) return 'description';
    if (m.qtyCol === colIdx) return 'qty';
    if (m.rateCol === colIdx) return 'rate';
    if (m.amountCol === colIdx) return 'amount';
    if (m.unitCol === colIdx) return 'unit';
    if (m.itemNumberCol === colIdx) return 'itemNumber';
    if (m.sectionCol === colIdx) return 'section';
    if (m.itemCol === colIdx) return 'item';
    return 'ignore';
  };

  if (!isOpen) return null;

  return (
    <div 
      id="boq-import-modal-overlay" 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
    >
      <div 
        id="boq-import-modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header */}
        <div className="bg-emerald-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 border border-emerald-700/60 flex items-center justify-center text-emerald-200 shadow-inner">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Import &amp; Understand Bill of Quantities (BOQ)
                </h2>
                <span className="bg-emerald-800/80 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-700/80 uppercase">
                  PDF • Excel • CSV • Text
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Full parameter controls for headers, rows, columns, BESMM4 trade sections, and Nigerian market rates.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {step === 'workspace' && (
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setErrorMessage(null);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold transition cursor-pointer border border-emerald-700/60"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Another</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setErrorMessage(null)} 
              className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Workspace Top Tabs (Only visible when document is loaded) */}
        {step === 'workspace' && (
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setWorkspaceTab('parameters')}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  workspaceTab === 'parameters'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>1. Parameters &amp; Column Mapping</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  workspaceTab === 'parameters' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalItemsCount} Recognized
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWorkspaceTab('review')}
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  workspaceTab === 'review'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>2. Review Line Items &amp; Destination</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  workspaceTab === 'review' ? 'bg-emerald-950/50 text-emerald-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {formatNaira(totalSubtotal)}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-600 flex items-center space-x-2">
              <span className="font-semibold truncate max-w-xs">{selectedFileName}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-bold">
                {totalItemsCount} items ready
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">

          {/* ========================================================================= */}
          {/* STEP 1: UPLOAD / SOURCE SELECTION */}
          {/* ========================================================================= */}
          {step === 'upload' && (
            <div className="space-y-5">
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
                  <span>Upload File (PDF, Excel, CSV, Text)</span>
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
                  <span>Paste Spreadsheet Text</span>
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
                    className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-2xl p-8 sm:p-10 text-center bg-emerald-50/40 hover:bg-emerald-50/80 transition cursor-pointer group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv,.txt,.pdf,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-8 h-8" />
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                      Click to choose or drag &amp; drop your BOQ document
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                      Supports PDF Bills of Quantities (<strong>.pdf</strong>), Excel spreadsheets (<strong>.xlsx, .xls</strong>), Comma-Separated Values (<strong>.csv</strong>), Tab-Delimited (<strong>.tsv</strong>), Text (<strong>.txt</strong>), or JSON files.
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
                    <p className="font-bold text-slate-800 mb-1">How to paste from Excel, Word, or PDF tables:</p>
                    <p>
                      1. Open your BOQ in Excel, Google Sheets, or PDF viewer. <br />
                      2. Highlight the rows containing columns such as <em>Description, Unit, Quantity, Rate, Amount</em> and press <strong>Ctrl+C</strong>. <br />
                      3. Paste directly into the box below and click <strong>&quot;Parse &amp; Configure Parameters&quot;</strong>.
                    </p>
                  </div>

                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste copied tabular rows here... Example:
Item | Description of Works | Unit | Quantity | Rate | Amount
1.1  | Excavate foundation trenches n.e 1.50m deep | m3 | 48 | 3800 | 182400
1.2  | Plain in-situ concrete 1:3:6 in blinding | m3 | 12 | 65000 | 780000"
                    className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700/50"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={!pastedText.trim() || isProcessing}
                      onClick={handleParsePastedText}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Parsing Rows...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Parse &amp; Configure Parameters</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SAMPLE 1-CLICK */}
              {activeSourceTab === 'sample' && (
                <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-sm">
                    <Sparkles className="w-7 h-7 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Standard Nigerian 2-Storey Residential Duplex BOQ
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                      Pre-loaded with 14 verified measurement items spanning Substructure, RC Frame, Blockwork, Roofing, Finishes, and Services measured to BESMM4 standards with current Nigerian market rates.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleLoadSample}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Load Demo BOQ to Review</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: WORKSPACE (PARAMETERS OR REVIEW) */}
          {/* ========================================================================= */}
          {step === 'workspace' && (
            <div className="space-y-5">

              {/* --------------------------------------------------------------------- */}
              {/* TAB 1: PARAMETERS & COLUMN MAPPING */}
              {/* --------------------------------------------------------------------- */}
              {workspaceTab === 'parameters' && (
                <div className="space-y-4">

                  {/* Sheet / Page Selector */}
                  {sheetNames.length > 0 && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Sheet / Page:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {sheetNames.length > 1 && (
                            <button
                              type="button"
                              onClick={handleSelectAllSheets}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                activeSheetName === '__ALL_SHEETS__'
                                  ? 'bg-emerald-800 text-white shadow-2xs'
                                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              All Sheets Combined ({combinedAllSheetsItems.length} items)
                            </button>
                          )}

                          {sheetNames.map((name) => {
                            const count = sheetItemCounts[name];
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleSelectSheet(name)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  activeSheetName === name
                                    ? 'bg-emerald-800 text-white shadow-2xs'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {name} {count !== undefined && count > 0 ? `(${count})` : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 font-medium">
                        Showing rows from <strong>{activeSheetName === '__ALL_SHEETS__' ? (sheetNames[0] || 'Sheet 1') : activeSheetName}</strong>
                      </div>
                    </div>
                  )}

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    
                    {/* Card 1: Row Boundaries */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                        <Hash className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Row Boundaries</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Header Row (Column Titles):
                        </label>
                        <select
                          value={importParams.headerRowIndex}
                          onChange={(e) => handleSetHeaderRow(Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          {activeRawRows.slice(0, 15).map((r, idx) => {
                            const snippet = (r || []).slice(0, 3).filter(Boolean).join(' | ');
                            return (
                              <option key={idx} value={idx}>
                                Row {idx + 1}: {snippet || '(Empty Row)'}
                              </option>
                            );
                          })}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Where Description, Qty, Rate labels reside.
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Items Start At Row:
                        </label>
                        <select
                          value={importParams.dataStartRowIndex}
                          onChange={(e) => handleSetDataStartRow(Number(e.target.value))}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          {activeRawRows.slice(0, 20).map((r, idx) => {
                            if (idx <= importParams.headerRowIndex) return null;
                            const snippet = (r || []).slice(0, 3).filter(Boolean).join(' | ');
                            return (
                              <option key={idx} value={idx}>
                                Row {idx + 1}: {snippet || '(Row Content)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* Card 2: Trade & Unit Defaults */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Trade &amp; Unit Fallbacks</span>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Default Trade Section:
                        </label>
                        <select
                          value={importParams.defaultSection}
                          onChange={(e) => {
                            const updated = { ...importParams, defaultSection: e.target.value };
                            setImportParams(updated);
                            runExtraction(activeSheetName, updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          {BESMM4_SECTIONS.map((sec) => (
                            <option key={sec} value={sec}>{sec}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Assigned when item row lacks an explicit trade header.
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Default Measurement Unit:
                        </label>
                        <select
                          value={importParams.defaultUnit}
                          onChange={(e) => {
                            const updated = { ...importParams, defaultUnit: e.target.value };
                            setImportParams(updated);
                            runExtraction(activeSheetName, updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="item">item (General Item)</option>
                          <option value="m2">m2 (Square Metres)</option>
                          <option value="m3">m3 (Cubic Metres)</option>
                          <option value="m">m (Linear Metres)</option>
                          <option value="nr">nr (Number / Quantity)</option>
                          <option value="kg">kg (Kilograms)</option>
                          <option value="t">t (Metric Tonnes)</option>
                          <option value="sum">sum (Lump Sum)</option>
                        </select>
                      </div>
                    </div>

                    {/* Card 3: Interpretation Rules */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                        <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Calculation &amp; Filter Rules</span>
                      </div>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importParams.autoCalculateAmount}
                          onChange={() => handleToggleParam('autoCalculateAmount')}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">
                          Auto-calculate <strong>Amount = Qty × Rate</strong>
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importParams.autoDeriveRate}
                          onChange={() => handleToggleParam('autoDeriveRate')}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">
                          Auto-derive <strong>Rate = Amount ÷ Qty</strong>
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importParams.filterSummaryRows}
                          onChange={() => handleToggleParam('filterSummaryRows')}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">
                          Ignore Collection &amp; Summary rows
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importParams.mergeMultilineNotes}
                          onChange={() => handleToggleParam('mergeMultilineNotes')}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">
                          Merge multi-line specification notes
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={importParams.allowUnpricedItems}
                          onChange={() => handleToggleParam('allowUnpricedItems')}
                          className="rounded text-emerald-700 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-700 font-medium">
                          Allow unpriced tender items (Rate = ₦0)
                        </span>
                      </label>
                    </div>

                  </div>

                  {/* Live Status Callout */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-emerald-950 font-semibold">
                        Engine Status: <strong>{totalItemsCount} line items</strong> successfully recognized
                        {totalSubtotal > 0 ? ` (Total Bill: ${formatNaira(totalSubtotal)})` : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={totalItemsCount === 0}
                      onClick={() => setWorkspaceTab('review')}
                      className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs cursor-pointer transition"
                    >
                      <span>Review Recognized Items ({totalItemsCount})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Interactive Raw Data Table with Column Mapping Badges */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          Raw Document Preview &amp; Column Mapping
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (Use dropdowns above each column to teach the engine which column is which)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Header Row: {importParams.headerRowIndex + 1} | Data Starts: Row {importParams.dataStartRowIndex + 1}
                      </span>
                    </div>

                    <div className="max-h-[460px] overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-700 sticky top-0 z-20 border-b border-slate-200">
                          {/* Column Mapping Selector Row */}
                          <tr className="bg-slate-100/90 border-b border-slate-200">
                            <th className="p-2 w-28 text-center text-slate-500 font-semibold uppercase text-[10px]">
                              Column Role:
                            </th>
                            {activeRawRows[0]?.map((_, colIdx) => {
                              const role = getColRole(colIdx);
                              return (
                                <th key={colIdx} className="p-1.5 min-w-[150px]">
                                  <select
                                    value={role}
                                    onChange={(e) => handleSetColumnRole(colIdx, e.target.value as any)}
                                    className={`w-full p-1 rounded-md text-[11px] font-bold border transition ${
                                      role === 'description'
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                                        : role === 'qty'
                                        ? 'bg-blue-100 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                                        : role === 'rate'
                                        ? 'bg-indigo-100 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                                        : role === 'amount'
                                        ? 'bg-purple-100 border-purple-500 text-purple-900 ring-1 ring-purple-500'
                                        : role === 'unit'
                                        ? 'bg-amber-100 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                                        : role === 'itemNumber'
                                        ? 'bg-slate-200 border-slate-400 text-slate-800'
                                        : role === 'section'
                                        ? 'bg-teal-100 border-teal-500 text-teal-900'
                                        : 'bg-white border-slate-300 text-slate-500'
                                    }`}
                                  >
                                    <option value="ignore">-- Ignore --</option>
                                    <option value="description">★ Description of Works</option>
                                    <option value="qty">Quantity</option>
                                    <option value="unit">Unit of Measure</option>
                                    <option value="rate">Unit Rate (₦)</option>
                                    <option value="amount">Total Amount (₦)</option>
                                    <option value="itemNumber">Item No / S/N</option>
                                    <option value="section">Trade Section</option>
                                    <option value="item">Short Title</option>
                                  </select>
                                </th>
                              );
                            })}
                          </tr>

                          {/* Raw Header Row preview */}
                          <tr className="text-slate-600 font-mono text-[11px]">
                            <th className="p-2 text-center text-slate-400">Row #</th>
                            {activeRawRows[0]?.map((_, colIdx) => (
                              <th key={colIdx} className="p-2 text-slate-500 font-semibold truncate max-w-[200px]">
                                {sheetHeaders[colIdx] || `Col ${colIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {activeRawRows.slice(0, 25).map((row, rIdx) => {
                            const isHeaderRow = rIdx === importParams.headerRowIndex;
                            const isDataStartRow = rIdx === importParams.dataStartRowIndex;
                            const isBeforeData = rIdx < importParams.dataStartRowIndex;

                            return (
                              <tr 
                                key={rIdx}
                                className={`transition ${
                                  isHeaderRow 
                                    ? 'bg-emerald-100/60 font-bold border-y-2 border-emerald-600' 
                                    : isDataStartRow
                                    ? 'bg-blue-50/60 border-t-2 border-blue-400'
                                    : isBeforeData
                                    ? 'bg-slate-50 text-slate-400'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Row Control Cell */}
                                <td className="p-2 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center space-x-1">
                                    <span className="font-mono text-[10px] text-slate-500 font-bold">
                                      #{rIdx + 1}
                                    </span>
                                    {isHeaderRow ? (
                                      <span className="px-1.5 py-0.5 bg-emerald-800 text-white rounded text-[9px] font-black uppercase tracking-wider">
                                        Header
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleSetHeaderRow(rIdx)}
                                        className="text-[9px] px-1 py-0.5 bg-slate-200 hover:bg-emerald-700 hover:text-white rounded text-slate-600 transition cursor-pointer"
                                        title="Set this row as table header"
                                      >
                                        Set Header
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Column Data Cells with Role Highlighting */}
                                {row.map((cell, colIdx) => {
                                  const role = getColRole(colIdx);
                                  return (
                                    <td 
                                      key={colIdx} 
                                      className={`p-2 text-xs truncate max-w-[240px] font-mono ${
                                        role === 'description'
                                          ? 'bg-emerald-50/40 text-emerald-950 font-sans font-medium'
                                          : role === 'qty'
                                          ? 'bg-blue-50/40 text-blue-950 text-right'
                                          : role === 'rate'
                                          ? 'bg-indigo-50/40 text-indigo-950 text-right'
                                          : role === 'amount'
                                          ? 'bg-purple-50/40 text-purple-950 text-right'
                                          : role === 'unit'
                                          ? 'bg-amber-50/40 text-amber-950 text-center font-bold'
                                          : ''
                                      }`}
                                    >
                                      {cell !== null && cell !== undefined ? String(cell) : ''}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* TAB 2: REVIEW LINE ITEMS & DESTINATION */}
              {/* --------------------------------------------------------------------- */}
              {workspaceTab === 'review' && (
                <div className="space-y-4">

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
                          onClick={() => setWorkspaceTab('parameters')}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold cursor-pointer shadow-2xs"
                          title="Open parameters and column mapping configuration"
                        >
                          <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Tweak Parameters</span>
                        </button>

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

                  {/* Editable Review Table Grid */}
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

                                {/* Description Field */}
                                <td className="py-2 px-3">
                                  <textarea
                                    rows={1}
                                    value={item.description}
                                    onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                    className="w-full text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded font-medium text-slate-900 resize-y"
                                  />
                                </td>

                                {/* Unit Field */}
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="text"
                                    value={item.unit}
                                    onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                                    className="w-14 text-center font-bold text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded text-slate-700"
                                  />
                                </td>

                                {/* Quantity Field */}
                                <td className="py-2 px-3 text-right">
                                  <input
                                    type="number"
                                    value={item.qty || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'qty', Number(e.target.value))}
                                    className="w-20 text-right font-mono text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded font-semibold text-slate-900"
                                  />
                                </td>

                                {/* Rate Field */}
                                <td className="py-2 px-3 text-right">
                                  <FormattedNumberInput
                                    value={item.rate}
                                    onChange={(val) => handleUpdateItem(item.id, 'rate', val)}
                                    className="w-24 text-right font-mono text-xs p-1 bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded font-bold text-slate-900"
                                  />
                                </td>

                                {/* Amount Field */}
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatNaira(item.amount)}
                                </td>

                                {/* Delete Row */}
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded transition cursor-pointer"
                                    title="Delete line item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {reviewedItems.length === 0 && (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                <div className="max-w-sm mx-auto space-y-3">
                                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                                  <p className="font-semibold text-slate-800 text-sm">
                                    No line items detected yet
                                  </p>
                                  <p className="text-slate-500 text-xs">
                                    Click <strong>&quot;Parameters &amp; Column Mapping&quot;</strong> tab above to teach the engine which columns represent Description, Quantity, and Rate.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setWorkspaceTab('parameters')}
                                    className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                                  >
                                    Open Parameters &amp; Mapping
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
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

                  {/* Destination Options */}
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
                      {/* Option 1: Current Project */}
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

                      {/* Option 3: Existing Project */}
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

                    {/* Sub-options for Current or Existing Project */}
                    {(destinationMode === 'current' || destinationMode === 'existing') && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        {destinationMode === 'existing' && (
                          <div className="flex-1 max-w-sm">
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Project:</label>
                            <select
                              value={selectedExistingProjectId}
                              onChange={(e) => setSelectedExistingProjectId(e.target.value)}
                              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                            >
                              {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.title} ({p.items?.length || 0} items)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-slate-700">Merge Strategy:</span>
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="import_mode"
                              value="replace"
                              checked={importMode === 'replace'}
                              onChange={() => setImportMode('replace')}
                              className="text-emerald-700"
                            />
                            <span>Replace Existing Items</span>
                          </label>
                          <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="import_mode"
                              value="append"
                              checked={importMode === 'append'}
                              onChange={() => setImportMode('append')}
                              className="text-emerald-700"
                            />
                            <span>Append to Existing</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* New Project Form */}
                    {destinationMode === 'new' && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">New Project Title</label>
                          <input
                            type="text"
                            value={newProjectTitle}
                            onChange={(e) => setNewProjectTitle(e.target.value)}
                            placeholder="e.g. 4-Bedroom Duplex at Lekki Phase 1"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Nigerian State</label>
                          <select
                            value={newProjectLocation}
                            onChange={(e) => setNewProjectLocation(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            {ALL_NIGERIAN_STATES.map((state) => (
                              <option key={state.name} value={state.name}>{state.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Name</label>
                          <input
                            type="text"
                            value={newProjectClient}
                            onChange={(e) => setNewProjectClient(e.target.value)}
                            placeholder="Client Name or Org"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Profit &amp; Overhead (%)</label>
                          <input
                            type="number"
                            value={newProjectPoPercent}
                            onChange={(e) => setNewProjectPoPercent(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">VAT (%)</label>
                          <input
                            type="number"
                            value={newProjectVatPercent}
                            onChange={(e) => setNewProjectVatPercent(Number(e.target.value))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {step === 'workspace' && (
              <span>
                <strong>{totalItemsCount}</strong> items ready &bull; Total Subtotal:{' '}
                <strong className="text-emerald-800 font-mono text-sm">{formatNaira(totalSubtotal)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            {step === 'workspace' && workspaceTab === 'parameters' && (
              <button
                type="button"
                onClick={() => setWorkspaceTab('review')}
                disabled={totalItemsCount === 0}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>Go to Review ({totalItemsCount} Items)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 'workspace' && workspaceTab === 'review' && (
              <button
                type="button"
                disabled={reviewedItems.length === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm &amp; Import BOQ ({reviewedItems.length} Items)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
