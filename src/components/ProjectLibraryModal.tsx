import React, { useState, useEffect } from 'react';
import { 
  X, 
  FolderOpen, 
  FileText, 
  Upload, 
  Trash2, 
  Eye, 
  Sparkles, 
  Plus, 
  Check, 
  Download, 
  AlertCircle, 
  Search,
  Filter,
  Layers, 
  FileCode,
  FileSpreadsheet,
  Building,
  HardHat
} from 'lucide-react';
import { ProjectLibraryItem, ProjectLibraryCategory } from '../types';
import { safeFetchJson } from '../utils/api';

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onSelectDrawingForTakeoff?: (item: ProjectLibraryItem) => void;
}

const LIBRARY_CATEGORIES: ProjectLibraryCategory[] = [
  'Architectural Drawings',
  'Structural Drawings',
  'Electrical',
  'Plumbing',
  'BOQ',
  'Estimates',
  'Valuations',
  'Certificates',
  'Variations',
  'Contracts',
  'Reports'
];

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSelectDrawingForTakeoff,
}) => {
  const [items, setItems] = useState<ProjectLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Item State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectLibraryCategory>('Architectural Drawings');
  const [newNotes, setNewNotes] = useState('');
  const [newFileType, setNewFileType] = useState('PDF');
  const [newFileSize, setNewFileSize] = useState('1.2 MB');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load items from API or fallback to sample project library items
  const fetchLibraryItems = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson<{ documents: any[] }>(`/api/projects/${projectId}/documents`);
      if (ok && data?.documents && data.documents.length > 0) {
        const mapped: ProjectLibraryItem[] = data.documents.map((doc: any) => {
          let cat: ProjectLibraryCategory = 'Architectural Drawings';
          const cLower = (doc.category || '').toLowerCase();
          if (cLower.includes('struct')) cat = 'Structural Drawings';
          else if (cLower.includes('elec')) cat = 'Electrical';
          else if (cLower.includes('plumb') || cLower.includes('mech')) cat = 'Plumbing';
          else if (cLower.includes('boq')) cat = 'BOQ';
          else if (cLower.includes('estimate')) cat = 'Estimates';
          else if (cLower.includes('val')) cat = 'Valuations';
          else if (cLower.includes('cert')) cat = 'Certificates';
          else if (cLower.includes('var')) cat = 'Variations';
          else if (cLower.includes('contract')) cat = 'Contracts';
          else if (cLower.includes('report')) cat = 'Reports';

          const sizeKb = Math.round((doc.file_size || 500000) / 1024);
          const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

          return {
            id: doc.id,
            project_id: projectId,
            category: cat,
            name: doc.title || doc.file_name || 'Project Document',
            file_type: (doc.file_type || 'application/pdf').includes('pdf') ? 'PDF' : 'IMAGE',
            file_size: sizeStr,
            uploaded_at: doc.created_at || new Date().toISOString(),
            notes: doc.notes || doc.file_name,
            url: doc.file_path,
          };
        });
        setItems(mapped);
      } else {
        // Provide standard initial project library items for this project
        const defaultItems: ProjectLibraryItem[] = [
          {
            id: 'lib-1',
            project_id: projectId,
            category: 'Architectural Drawings',
            name: `${projectTitle} - Architectural Floor Plans & Elevations`,
            file_type: 'PDF',
            file_size: '3.4 MB',
            uploaded_at: new Date().toISOString(),
            notes: 'Approved architectural working drawings with dimension grid and schedule of doors/windows',
          },
          {
            id: 'lib-2',
            project_id: projectId,
            category: 'Structural Drawings',
            name: `${projectTitle} - Structural Engineering Details`,
            file_type: 'PDF',
            file_size: '4.1 MB',
            uploaded_at: new Date().toISOString(),
            notes: 'Foundation layout, column sections, and roof truss connection details',
          },
          {
            id: 'lib-3',
            project_id: projectId,
            category: 'BOQ',
            name: 'Priced Bill of Quantities (BESMM4)',
            file_type: 'XLSX',
            file_size: '840 KB',
            uploaded_at: new Date().toISOString(),
            notes: 'Current working BOQ version with full trade rate build-ups',
          }
        ];
        setItems(defaultItems);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibraryItems();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setNewName(file.name.replace(/\.[^/.]+$/, ''));
    const sizeKb = Math.round(file.size / 1024);
    setNewFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
    setNewFileType(file.name.endsWith('.pdf') ? 'PDF' : file.type.includes('image') ? 'IMAGE' : 'DOC');
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: ProjectLibraryItem = {
      id: 'lib-' + Date.now(),
      project_id: projectId,
      category: newCategory,
      name: newName.trim(),
      file_type: newFileType,
      file_size: newFileSize,
      uploaded_at: new Date().toISOString(),
      notes: newNotes.trim() || undefined,
    };

    try {
      // Sync with backend documents API
      await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.name,
          category: newItem.category,
          fileName: selectedFile?.name || `${newItem.name}.${newFileType.toLowerCase()}`,
          fileSize: 1024 * 1024,
          fileType: newFileType,
          notes: newItem.notes,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setItems((prev) => [newItem, ...prev]);
    setIsAddingNew(false);
    setNewName('');
    setNewNotes('');
    setSelectedFile(null);
  };

  const handleDeleteItem = async (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    try {
      await fetch(`/api/projects/${projectId}/documents/${itemId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || (item.notes && item.notes.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div id="project-library-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  Project Drawing &amp; Document Library
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {items.length} Files
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Centralized repository for drawings, bills of quantities, rate schedules, and valuation certificates for <span className="text-slate-200 font-semibold">{projectTitle}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Library"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drawings, BOQs, certificates, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNew ? 'Cancel Upload' : 'Add Document'}</span>
            </button>
          </div>
        </div>

        {/* Upload Drawer / Form */}
        {isAddingNew && (
          <form onSubmit={handleAddItem} className="bg-emerald-50/60 border-b border-emerald-100 p-5 space-y-4 text-xs sm:text-sm">
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Add Document to Project Library</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Name / Title</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ground Floor Plan Rev B"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ProjectLibraryCategory)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {LIBRARY_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (.pdf, .jpg, .xlsx)</label>
                <input
                  type="file"
                  onChange={handleFileSelection}
                  className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-emerald-700 file:border file:border-slate-300 hover:file:bg-slate-50 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Notes / Revision Remarks</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Incorporates revised staircase geometry and updated column sizes"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition cursor-pointer"
              >
                Save to Library
              </button>
            </div>
          </form>
        )}

        {/* Category Filter Pills */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 overflow-x-auto gap-1 text-xs font-medium py-2.5 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`py-1.5 px-3 rounded-lg whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({items.length})
          </button>
          {LIBRARY_CATEGORIES.map((cat) => {
            const count = items.filter((it) => it.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat ? 'bg-emerald-900 text-emerald-200' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading library items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No documents found in this category</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add architectural drawings, structural plans, BOQ schedules, or valuation certificates to keep this project organized.
              </p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First File</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const isDrawing = item.category === 'Architectural Drawings' || item.category === 'Structural Drawings';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isDrawing ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isDrawing ? <Building className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                            {item.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-600 uppercase">{item.file_type}</span>
                            <span>•</span>
                            <span>{item.file_size || '1.0 MB'}</span>
                            <span>•</span>
                            <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      {isDrawing && onSelectDrawingForTakeoff ? (
                        <button
                          onClick={() => onSelectDrawingForTakeoff(item)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Run AI Takeoff</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Archived Project Asset</span>
                      )}

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => alert(`Document "${item.name}" is stored in the project library.`)}
                          className="text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 bg-slate-50 p-3 sm:px-6 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <HardHat className="w-4 h-4 text-emerald-600" />
            <span>Files linked to active BESMM4 takeoff model and Nigerian statutory documentation.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
