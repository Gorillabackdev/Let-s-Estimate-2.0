import React, { useState, useEffect } from 'react';
import { ProjectDocument } from '../types';
import { 
  X, FolderOpen, FileText, Upload, Trash2, Eye, Sparkles, Plus, 
  Check, Download, AlertCircle, FileCode, Layers, FileSpreadsheet
} from 'lucide-react';

interface ProjectDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onSelectDrawingForTakeoff?: (doc: ProjectDocument) => void;
}

const CATEGORIES = [
  'All Documents',
  'Architectural',
  'Structural',
  'Mechanical & Electrical',
  'Geotechnical',
  'Tender & Contract',
  'Site Photo'
] as const;

export const ProjectDocumentsModal: React.FC<ProjectDocumentsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSelectDrawingForTakeoff,
}) => {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Documents');
  const [isUploading, setIsUploading] = useState(false);

  // New Document Form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectDocument['category']>('Architectural');
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('application/pdf');
  const [newFileSize, setNewFileSize] = useState(1024 * 512);

  const fetchDocs = () => {
    if (!projectId) return;
    setLoading(true);
    fetch(`/api/projects/${projectId}/documents`)
      .then((res) => res.json())
      .then((data) => {
        if (data.documents) setDocuments(data.documents);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
    }
  }, [isOpen, projectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewFileName(file.name);
    setNewFileSize(file.size);
    setNewFileType(file.type || 'application/pdf');
    if (!newTitle) {
      setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmitNewDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newFileName) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          fileName: newFileName,
          fileSize: newFileSize,
          fileType: newFileType,
          filePath: ''
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsUploading(false);
        setNewTitle('');
        setNewFileName('');
        fetchDocs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const filteredDocs = selectedCategory === 'All Documents'
    ? documents
    : documents.filter(d => d.category === selectedCategory);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Project Drawings & Document Repository
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {documents.length} Files
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Architectural plans, structural engineering calculations, M&E schematics & addenda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar & Categories */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsUploading(!isUploading)}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Cancel Upload' : 'Upload Document'}</span>
          </button>
        </div>

        {/* Upload Form Drawer */}
        {isUploading && (
          <form onSubmit={handleSubmitNewDoc} className="p-4 bg-emerald-50/50 border-b border-emerald-200 text-xs space-y-3 animate-fade-in">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-700" />
              <span>Attach Drawing or Contract Document</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Floor Plan & Elevations"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Discipline / Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Architectural">Architectural Drawing</option>
                  <option value="Structural">Structural Engineering (BBS / Slabs)</option>
                  <option value="Mechanical & Electrical">Mechanical & Electrical (M&E)</option>
                  <option value="Geotechnical">Geotechnical / Soil Report</option>
                  <option value="Tender & Contract">Tender Letter & Specifications</option>
                  <option value="Site Photo">Site Condition Photo</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select File (.pdf, .png, .jpg, .dwg)</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full p-1.5 bg-white rounded-lg border border-slate-300 text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsUploading(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFileName || !newTitle}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-lg font-bold shadow-xs transition"
              >
                Save to Project
              </button>
            </div>
          </form>
        )}

        {/* Documents Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading repository documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <FolderOpen className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No documents found in this category.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Click "Upload Document" to attach architectural drawings, structural layouts, or soil test reports to this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">{doc.title}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {doc.category}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatBytes(doc.file_size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString('en-GB')}
                    </span>

                    <div className="flex items-center space-x-2">
                      {onSelectDrawingForTakeoff && (doc.category === 'Architectural' || doc.file_name.match(/\.(pdf|png|jpg|jpeg)$/i)) && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectDrawingForTakeoff(doc);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>AI Takeoff</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Supported formats: Architectural PDF plans, AutoCAD DWG exports, PNG/JPG scans.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
