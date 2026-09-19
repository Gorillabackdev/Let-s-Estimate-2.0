import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  Star, 
  Truck, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  FileSpreadsheet, 
  MessageSquare, 
  Trash2, 
  Info,
  DollarSign,
  Package,
  Layers,
  ChevronRight,
  AlertCircle,
  Users,
  Wrench,
  HardHat
} from 'lucide-react';
import { Supplier, SupplierItemPrice } from '../../types';
import { safeFetchJson } from '../../utils/api';
import { formatNaira } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

interface SuppliersViewProps {
  onSelectSupplierForEstimate?: (supplier: Supplier) => void;
  onNavigateToMaterials?: () => void;
}

const CATEGORIES = [
  'All Trades',
  'Plant & Equipment Hire',
  'Labour & Subcontractors',
  'Preliminaries & Site Services',
  'Cement & Aggregates',
  'Steel & Rebar',
  'Blocks & Masonry',
  'Roofing & Cladding',
  'MEP & Electrical',
  'Timber & Formwork',
  'Finishing & Tiles'
];

const RESOURCE_TABS = [
  { id: 'all', label: 'All Directory' },
  { id: 'materials', label: 'Materials Suppliers' },
  { id: 'plants', label: 'Plant & Heavy Equipment' },
  { id: 'labour', label: 'Labour & Subcontractors' },
  { id: 'preliminaries', label: 'Preliminaries & Site Setup' }
];

const STATES = [
  'All States / Zones',
  'Lagos',
  'Abuja (FCT)',
  'Rivers / Port Harcourt',
  'Northern Hub (Kano / Kaduna)',
  'Ogun',
  'Enugu',
  'Delta'
];

export const SuppliersView: React.FC<SuppliersViewProps> = ({ 
  onSelectSupplierForEstimate,
  onNavigateToMaterials 
}) => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Trades');
  const [selectedState, setSelectedState] = useState('All States');
  const [activeResourceTab, setActiveResourceTab] = useState<'all' | 'materials' | 'plants' | 'labour' | 'preliminaries'>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [rfqSupplier, setRfqSupplier] = useState<Supplier | null>(null);
  const [rfqNote, setRfqNote] = useState('');
  const [rfqCopied, setRfqCopied] = useState(false);

  // New Supplier Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Supplier['category']>('Plant & Equipment Hire');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newState, setNewState] = useState('Lagos');
  const [newCoverageAreas, setNewCoverageAreas] = useState('Lagos & South West');
  const [newLeadTime, setNewLeadTime] = useState('24-48 hours');
  const [newMinOrder, setNewMinOrder] = useState('1 Day / 1 Gang / 100 units');
  const [newPaymentTerms, setNewPaymentTerms] = useState('Bank Transfer / COD');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load suppliers
  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const { ok, data } = await safeFetchJson<{ success: boolean; suppliers: Supplier[] }>('/api/suppliers');
      if (ok && data?.suppliers) {
        setSuppliers(data.suppliers);
      }
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Filter logic
  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.materials?.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Resource section filter
    let matchesResource = true;
    if (activeResourceTab === 'plants') {
      matchesResource = s.category === 'Plant & Equipment Hire';
    } else if (activeResourceTab === 'labour') {
      matchesResource = s.category === 'Labour & Subcontractors';
    } else if (activeResourceTab === 'preliminaries') {
      matchesResource = s.category === 'Preliminaries & Site Services';
    } else if (activeResourceTab === 'materials') {
      matchesResource = !['Plant & Equipment Hire', 'Labour & Subcontractors', 'Preliminaries & Site Services'].includes(s.category);
    }

    // Regional State filter
    let matchesState = true;
    if (selectedState !== 'All States' && selectedState !== 'All States / Zones') {
      const q = selectedState.toLowerCase();
      if (q.includes('rivers') || q.includes('port harcourt')) {
        matchesState = 
          s.state?.toLowerCase().includes('rivers') || 
          s.state?.toLowerCase().includes('port harcourt') ||
          s.address?.toLowerCase().includes('port harcourt') ||
          s.coverageAreas?.toLowerCase().includes('port harcourt') ||
          s.coverageAreas?.toLowerCase().includes('delta');
      } else if (q.includes('abuja')) {
        matchesState = 
          s.state?.toLowerCase().includes('abuja') || 
          s.address?.toLowerCase().includes('abuja') || 
          s.address?.toLowerCase().includes('fct') ||
          s.coverageAreas?.toLowerCase().includes('abuja');
      } else if (q.includes('lagos')) {
        matchesState = 
          s.state?.toLowerCase().includes('lagos') || 
          s.address?.toLowerCase().includes('lagos') ||
          s.coverageAreas?.toLowerCase().includes('lagos');
      } else if (q.includes('northern') || q.includes('kano')) {
        matchesState = 
          s.state?.toLowerCase().includes('kano') || 
          s.state?.toLowerCase().includes('kaduna') ||
          s.coverageAreas?.toLowerCase().includes('northern') ||
          s.coverageAreas?.toLowerCase().includes('kano');
      } else {
        matchesState = s.state?.toLowerCase() === selectedState.toLowerCase();
      }
    }

    const matchesCategory = selectedCategory === 'All Trades' || s.category === selectedCategory;

    return matchesSearch && matchesResource && matchesCategory && matchesState;
  });

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        name: newName,
        category: newCategory,
        contactPerson: newContactPerson,
        phone: newPhone,
        whatsapp: newWhatsapp || newPhone,
        email: newEmail,
        address: newAddress,
        state: newState,
        coverageAreas: newCoverageAreas,
        leadTime: newLeadTime,
        minOrder: newMinOrder,
        paymentTerms: newPaymentTerms,
        verificationStatus: 'Verified',
        rating: 4.8,
        notes: newNotes,
        materials: []
      };

      const { ok, data } = await safeFetchJson<{ success: boolean; supplier: Supplier }>('/api/suppliers', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (ok && data?.supplier) {
        setSuppliers(prev => [data.supplier, ...prev]);
        setIsAddModalOpen(false);
        // Reset form
        setNewName('');
        setNewContactPerson('');
        setNewPhone('');
        setNewWhatsapp('');
        setNewEmail('');
        setNewAddress('');
        setNewNotes('');
      }
    } catch (err) {
      console.error('Failed to create supplier:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove vendor "${name}"?`)) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const { ok } = await safeFetchJson(`/api/suppliers/${id}`, {
        method: 'DELETE',
        headers
      });

      if (ok) {
        setSuppliers(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete supplier:', e);
    }
  };

  const openRfqModal = (supplier: Supplier) => {
    setRfqSupplier(supplier);
    
    let memoText = '';
    if (supplier.category === 'Plant & Equipment Hire') {
      memoText = `Dear ${supplier.contactPerson || supplier.name},\n\nPlease provide formal quotation and availability schedule for plant and heavy construction equipment hire:\n\nRequested Plant & Equipment:\n${(supplier.materials || []).map((m, idx) => `${idx + 1}. ${m.name} - Unit: ${m.unit} (Benchmark: ${formatNaira(m.rate)})`).join('\n')}\n\nProject Location: Lagos State\nLease Terms: Wet lease with certified operator & daily maintenance.\nMobilization: Within 24-48 hours of confirmation.\n\nBest regards,\nPlant & Logistics Coordinator\nLet's Estimate Procurement Hub`;
    } else if (supplier.category === 'Labour & Subcontractors') {
      memoText = `Dear ${supplier.contactPerson || supplier.name},\n\nPlease provide labor availability, gang mobilization schedule, and subcontracting rates for our project:\n\nRequested Artisan Gangs / Trade Labour:\n${(supplier.materials || []).map((m, idx) => `${idx + 1}. ${m.name} - Wage Unit: ${m.unit} (Benchmark: ${formatNaira(m.rate)})`).join('\n')}\n\nProject Location: Lagos State\nSafety Requirements: NIOB/Trade certified, PPE compliant, site foreman supervision.\n\nBest regards,\nProject Quantity Surveyor\nLet's Estimate Procurement Hub`;
    } else if (supplier.category === 'Preliminaries & Site Services') {
      memoText = `Dear ${supplier.contactPerson || supplier.name},\n\nPlease provide quotation and installation lead times for project preliminaries & site establishment facilities:\n\nRequested Facilities & Services:\n${(supplier.materials || []).map((m, idx) => `${idx + 1}. ${m.name} - Unit: ${m.unit} (Benchmark: ${formatNaira(m.rate)})`).join('\n')}\n\nProject Location: Lagos State\nSite Access: Ready for immediate mobilization and installation.\n\nBest regards,\nContracts & Procurement Manager\nLet's Estimate Procurement Hub`;
    } else {
      memoText = `Dear ${supplier.contactPerson || supplier.name},\n\nPlease provide formal depot quotation and site delivery lead times for our upcoming project.\n\nRequired Materials:\n${(supplier.materials || []).map((m, idx) => `${idx + 1}. ${m.name} - Unit: ${m.unit} (Benchmark: ${formatNaira(m.rate)})`).join('\n')}\n\nProject Location: Lagos State\nDelivery Requirement: Within 48 hours of PO confirmation.\n\nBest regards,\nQuantity Surveying Department\nLet's Estimate Procurement Hub`;
    }

    setRfqNote(memoText);
    setRfqCopied(false);
    setIsRfqModalOpen(true);
  };

  const handleCopyRfq = () => {
    navigator.clipboard.writeText(rfqNote);
    setRfqCopied(true);
    setTimeout(() => setRfqCopied(false), 2500);
  };

  const handleSendWhatsApp = (phone?: string, text?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(text || 'Hello, I am reaching out from Let\'s Estimate procurement portal regarding building material quotation.');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div id="suppliers-procurement-hub" className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* 1. Header & Explanatory Context */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Library Directory
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                NIQS Verified Nigerian Depots
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-emerald-700" />
              Suppliers &amp; Vendor Procurement Directory
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              <strong>What is this Directory for?</strong> Manage certified Nigerian building material vendors, heavy plant &amp; equipment leasing yards, certified artisan labor guilds, and site preliminaries contractors. Source real competitive quotes, check mobilization lead times, and dispatch direct WhatsApp procurement inquiries.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToMaterials && (
              <button
                type="button"
                onClick={onNavigateToMaterials}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Materials &amp; Rate Library</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Vendor</span>
            </button>
          </div>
        </div>

        {/* Resource Type Primary Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {RESOURCE_TABS.map(tab => {
            const isActive = activeResourceTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveResourceTab(tab.id as any);
                  setSelectedCategory('All Trades');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.id === 'plants' && <Truck className="w-3.5 h-3.5 text-amber-400" />}
                {tab.id === 'labour' && <Users className="w-3.5 h-3.5 text-blue-400" />}
                {tab.id === 'preliminaries' && <Wrench className="w-3.5 h-3.5 text-teal-400" />}
                {tab.id === 'materials' && <Layers className="w-3.5 h-3.5 text-emerald-400" />}
                {tab.id === 'all' && <Building2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {suppliers.filter(s => {
                    if (tab.id === 'plants') return s.category === 'Plant & Equipment Hire';
                    if (tab.id === 'labour') return s.category === 'Labour & Subcontractors';
                    if (tab.id === 'preliminaries') return s.category === 'Preliminaries & Site Services';
                    if (tab.id === 'materials') return !['Plant & Equipment Hire', 'Labour & Subcontractors', 'Preliminaries & Site Services'].includes(s.category);
                    return true;
                  }).length}
                </span>
              </button>
            );
          })}
        </div>

        {/* 3 Quick Facts banner */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Truck className="w-4 h-4 text-amber-600 shrink-0" />
            <span><strong>Plant Hire Fleets:</strong> Excavators, 20t/30t tippers &amp; concrete mixers</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span><strong>Certified Labour Gangs:</strong> Masons, iron benders &amp; trade artisans</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <Wrench className="w-4 h-4 text-teal-600 shrink-0" />
            <span><strong>Preliminaries &amp; Sites:</strong> Scaffolding, containers &amp; borehole drilling</span>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by supplier name, contact person, depot location, or material..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* State Dropdown */}
          <div className="w-full md:w-52 shrink-0">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
            >
              {STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trade Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-emerald-800 text-white font-bold shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Suppliers Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading verified supplier network...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No suppliers found matching your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search query, state filter, or trade category. You can also add your own site supplier.
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSelectedCategory('All Trades'); setSelectedState('All States'); }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border mb-1 ${
                      supplier.category === 'Plant & Equipment Hire' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      supplier.category === 'Labour & Subcontractors' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      supplier.category === 'Preliminaries & Site Services' ? 'bg-teal-50 text-teal-800 border-teal-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                    }`}>
                      {supplier.category === 'Plant & Equipment Hire' && <Truck className="w-3 h-3 mr-1 text-amber-600" />}
                      {supplier.category === 'Labour & Subcontractors' && <Users className="w-3 h-3 mr-1 text-blue-600" />}
                      {supplier.category === 'Preliminaries & Site Services' && <Wrench className="w-3 h-3 mr-1 text-teal-600" />}
                      {!['Plant & Equipment Hire', 'Labour & Subcontractors', 'Preliminaries & Site Services'].includes(supplier.category) && <Building2 className="w-3 h-3 mr-1 text-emerald-600" />}
                      {supplier.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {supplier.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200/60">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{supplier.rating || 4.8}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {supplier.verificationStatus}
                    </span>
                  </div>
                </div>

                {/* Location and Contact */}
                <div className="space-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{supplier.address} ({supplier.state} State)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{supplier.phone}</span>
                    </div>
                    {supplier.contactPerson && (
                      <span className="text-slate-400">| Rep: <strong className="text-slate-700">{supplier.contactPerson}</strong></span>
                    )}
                  </div>
                </div>

                {/* Logistics Badges */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">
                      {supplier.category === 'Plant & Equipment Hire' ? 'Mobilization Time:' :
                       supplier.category === 'Labour & Subcontractors' ? 'Notice Period:' :
                       supplier.category === 'Preliminaries & Site Services' ? 'Installation Lead:' : 'Lead Time:'}
                    </span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      {supplier.leadTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">
                      {supplier.category === 'Plant & Equipment Hire' ? 'Min Lease Term:' :
                       supplier.category === 'Labour & Subcontractors' ? 'Min Engagement:' :
                       supplier.category === 'Preliminaries & Site Services' ? 'Min Service Term:' : 'Min Order (MOQ):'}
                    </span>
                    <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Truck className="w-3 h-3 text-blue-600" />
                      {supplier.minOrder || 'Flexible'}
                    </span>
                  </div>
                </div>

                {/* Key Material / Resource Prices */}
                {supplier.materials && supplier.materials.length > 0 && (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      {supplier.category === 'Plant & Equipment Hire' ? 'Equipment Hire Rates:' :
                       supplier.category === 'Labour & Subcontractors' ? 'Trade Artisan Wages:' :
                       supplier.category === 'Preliminaries & Site Services' ? 'Site Services Benchmark:' :
                       'Depot Benchmark Prices:'}
                    </span>
                    <div className="space-y-1">
                      {supplier.materials.slice(0, 4).map((mat, i) => (
                        <div key={i} className="flex justify-between items-center text-xs py-0.5">
                          <span className="text-slate-700 truncate pr-2">{mat.name}</span>
                          <span className="font-bold text-emerald-800 shrink-0">
                            {formatNaira(mat.rate)} <span className="text-[10px] text-slate-500 font-normal">/{mat.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  {supplier.whatsapp && (
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(supplier.whatsapp, `Hello ${supplier.name}, I am contacting you from Let's Estimate regarding procurement rates.`)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200/60"
                      title="Direct WhatsApp order/chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openRfqModal(supplier)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    title="Generate official RFQ inquiry"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                    <span>Request RFQ</span>
                  </button>
                </div>

                {!['supp-dangote-01', 'supp-bua-02', 'supp-pulkit-03', 'supp-royal-04', 'supp-epe-05', 'supp-vibro-06', 'supp-topfeathers-07', 'supp-mambilla-08', 'supp-plant-julius-01', 'supp-plant-tipper-02', 'supp-labour-builders-01', 'supp-labour-mep-02', 'supp-prelim-scaffold-01', 'supp-prelim-sitecabins-02'].includes(supplier.id) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                    title="Delete custom supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD CUSTOM SUPPLIER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-700" />
                  Add New Vendor / Subcontractor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Register a materials supplier, equipment hiring depot, labour guild, or preliminaries contractor.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Depot Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alaba Rebar Depot & Logistics Ltd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trade Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                  >
                    {CATEGORIES.filter(c => c !== 'All Trades').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">State Location *</label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium"
                  >
                    {STATES.filter(s => s !== 'All States' && s !== 'All States / Zones').map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. Engr. Bayo Ade"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Direct Number</label>
                  <input
                    type="text"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. sales@alabarebar.ng"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Address / Yard Location</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Plot 15 Commercial Avenue, Mile 2 Industrial Park, Lagos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lead Time</label>
                  <input
                    type="text"
                    value={newLeadTime}
                    onChange={(e) => setNewLeadTime(e.target.value)}
                    placeholder="e.g. 24 hours / Same day"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order Quantity (MOQ)</label>
                  <input
                    type="text"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(e.target.value)}
                    placeholder="e.g. 5 tonnes / 300 bags"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment &amp; Credit Terms</label>
                <input
                  type="text"
                  value={newPaymentTerms}
                  onChange={(e) => setNewPaymentTerms(e.target.value)}
                  placeholder="e.g. 50% advance, balance on site offloading"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Special Notes / Credentials</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Mill test certificates available. Bulk discounts over 20 tonnes."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REQUEST QUOTATION (RFQ) */}
      {isRfqModalOpen && rfqSupplier && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                  Request for Quotation (RFQ)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">To: <strong>{rfqSupplier.name}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => setIsRfqModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Official RFQ Message Template:</label>
              <textarea
                rows={10}
                value={rfqNote}
                onChange={(e) => setRfqNote(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCopyRfq}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                {rfqCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Layers className="w-4 h-4 text-slate-500" />}
                <span>{rfqCopied ? 'Copied to Clipboard!' : 'Copy RFQ Text'}</span>
              </button>

              {rfqSupplier.whatsapp && (
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(rfqSupplier.whatsapp, rfqNote)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Send via WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
