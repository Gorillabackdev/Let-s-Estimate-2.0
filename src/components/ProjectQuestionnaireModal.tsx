/**
 * Let's Estimate - Pre-Estimation Project Questionnaire Modal
 * Captures critical architectural and engineering parameters to guide deterministic BOQ generation
 * and inform AI Vision Takeoff according to Nigerian construction practices (BESMM4).
 */

import React, { useState } from 'react';
import { ProjectQuestionnaire } from '../types';
import { FormattedNumberInput } from './common/FormattedNumberInput';
import { 
  X, 
  Building, 
  Layers, 
  Compass, 
  CheckCircle2, 
  Sliders, 
  Sparkles, 
  ShieldCheck,
  Check
} from 'lucide-react';

interface ProjectQuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndGenerate: (questionnaire: ProjectQuestionnaire, mode: 'deterministic' | 'save_only') => void;
  initialData?: ProjectQuestionnaire;
}

export const DEFAULT_QUESTIONNAIRE: ProjectQuestionnaire = {
  general: {
    projectType: 'Residential',
    buildingType: 'Bungalow',
    numberOfBuildings: 1,
    numberOfFloors: 1,
    numberOfRooms: 4,
    approximateGFA: 220,
    numberOfUnits: 1,
    location: 'Lagos',
    terrain: 'Normal',
  },
  substructure: {
    foundationType: 'Strip foundation',
    rcColumnsPresent: 'No',
    rcBeamsPresent: 'No',
    groundBeamsPresent: 'No',
    suspendedFloor: 'No',
    groundFloorConstruction: 'Ground-bearing slab',
    foundationDepth: '1.2m',
    basement: 'No',
  },
  superstructure: {
    structuralSystem: 'Load-bearing masonry',
    columns: 'No',
    beams: 'No',
    suspendedSlabs: 'No',
    staircase: 'None',
    numberOfStaircases: 0,
  },
  roofing: {
    roofType: 'Hip/Gable combination',
    roofStructure: 'Timber',
    roofCovering: 'Aluminium longspan',
    features: {
      ridge: true,
      hips: true,
      valleys: true,
      fascia: true,
      soffit: true,
      gutters: true,
      downpipes: true,
      flashings: true,
      insulation: false,
    },
  },
  finishes: {
    walls: 'Paint',
    floors: 'Porcelain',
    ceilings: 'POP',
    doors: 'Timber',
    windows: 'Aluminium casement',
  },
  services: {
    electrical: 'Included',
    plumbing: 'Included',
    mechanical: 'Excluded',
    externalWorks: 'Included',
    landscaping: 'Included',
    drainage: 'Included',
    fenceWall: 'Included',
    gate: 'Included',
  },
};

const mergeQuestionnaireWithDefaults = (input?: any): ProjectQuestionnaire => {
  const safe = input && typeof input === 'object' ? input : {};
  return {
    ...DEFAULT_QUESTIONNAIRE,
    ...safe,
    general: { ...DEFAULT_QUESTIONNAIRE.general, ...(safe.general || {}) },
    substructure: { ...DEFAULT_QUESTIONNAIRE.substructure, ...(safe.substructure || {}) },
    superstructure: { ...DEFAULT_QUESTIONNAIRE.superstructure, ...(safe.superstructure || {}) },
    roofing: {
      ...DEFAULT_QUESTIONNAIRE.roofing,
      ...(safe.roofing || {}),
      features: { ...DEFAULT_QUESTIONNAIRE.roofing.features, ...(safe.roofing?.features || {}) },
    },
    finishes: { ...DEFAULT_QUESTIONNAIRE.finishes, ...(safe.finishes || {}) },
    services: { ...DEFAULT_QUESTIONNAIRE.services, ...(safe.services || {}) },
  };
};

export const ProjectQuestionnaireModal: React.FC<ProjectQuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onSaveAndGenerate,
  initialData,
}) => {
  const [data, setData] = useState<ProjectQuestionnaire>(() => mergeQuestionnaireWithDefaults(initialData));
  const [activeTab, setActiveTab] = useState<'general' | 'substructure' | 'superstructure' | 'roofing' | 'finishes' | 'services'>('general');

  React.useEffect(() => {
    if (isOpen) {
      setData(mergeQuestionnaireWithDefaults(initialData));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleUpdate = (section: keyof ProjectQuestionnaire, field: string, value: any) => {
    setData((prev) => {
      const next: ProjectQuestionnaire = {
        ...prev,
        [section]: {
          ...(prev[section] as any),
          [field]: value,
        },
      };

      // Structural Integrity Logic:
      // If 1 floor (Bungalow), columns & suspended slabs must default to No
      if (section === 'general' && field === 'numberOfFloors') {
        const floors = value === '' ? 1 : Number(value);
        if (floors <= 1) {
          next.general.buildingType = 'Bungalow';
          next.superstructure.structuralSystem = 'Load-bearing masonry';
          next.superstructure.columns = 'No';
          next.superstructure.beams = 'No';
          next.superstructure.suspendedSlabs = 'No';
          next.substructure.rcColumnsPresent = 'No';
          next.superstructure.staircase = 'None';
          next.superstructure.numberOfStaircases = 0;
        } else {
          if (next.general.buildingType === 'Bungalow') {
            next.general.buildingType = floors === 2 ? '2-storey building' : 'Multi-storey';
          }
          next.superstructure.structuralSystem = 'Reinforced concrete frame';
          next.superstructure.columns = 'Yes';
          next.superstructure.beams = 'Yes';
          next.superstructure.suspendedSlabs = 'Yes';
          next.substructure.rcColumnsPresent = 'Yes';
          next.superstructure.staircase = 'Reinforced concrete';
          next.superstructure.numberOfStaircases = 1;
        }
      }

      if (section === 'general' && field === 'buildingType') {
        if (value === 'Bungalow') {
          next.general.numberOfFloors = 1;
          next.superstructure.structuralSystem = 'Load-bearing masonry';
          next.superstructure.columns = 'No';
          next.superstructure.beams = 'No';
          next.superstructure.suspendedSlabs = 'No';
          next.substructure.rcColumnsPresent = 'No';
          next.superstructure.staircase = 'None';
          next.superstructure.numberOfStaircases = 0;
        } else if (value === 'Duplex' || value === '2-Storey') {
          next.general.numberOfFloors = 2;
          next.superstructure.structuralSystem = 'Reinforced concrete frame';
          next.superstructure.columns = 'Yes';
          next.superstructure.beams = 'Yes';
          next.superstructure.suspendedSlabs = 'Yes';
          next.substructure.rcColumnsPresent = 'Yes';
          next.superstructure.staircase = 'Reinforced concrete';
          next.superstructure.numberOfStaircases = 1;
        }
      }

      // Roof feature constraint: Gable roofs have NO valley gutters
      if (section === 'roofing' && field === 'roofType') {
        if (value === 'Gable') {
          next.roofing.features.valleys = false;
          next.roofing.features.hips = false;
        } else if (value === 'Hip' || value === 'Hip/Gable combination') {
          next.roofing.features.valleys = true;
          next.roofing.features.hips = true;
        }
      }

      return next;
    });
  };

  const handleToggleRoofFeature = (featureKey: keyof ProjectQuestionnaire['roofing']['features']) => {
    setData((prev) => ({
      ...prev,
      roofing: {
        ...prev.roofing,
        features: {
          ...prev.roofing.features,
          [featureKey]: !prev.roofing.features[featureKey],
        },
      },
    }));
  };

  const getSanitizedData = (): ProjectQuestionnaire => {
    return {
      ...data,
      general: {
        ...data.general,
        numberOfFloors: Math.max(1, Number(data.general?.numberOfFloors) || 1),
        approximateGFA: Math.max(10, Number(data.general?.approximateGFA) || 220),
        numberOfRooms: Math.max(1, Number(data.general?.numberOfRooms) || 4),
        location: data.general?.location?.trim() || 'Lagos',
      },
    };
  };

  return (
    <div id="project-questionnaire-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Pre-Estimation Project Questionnaire
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  BESMM4 Standard
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Enforces structural logic: bungalows have no RC columns or suspended slabs; gable roofs have no valley gutters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Questionnaire"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 overflow-x-auto gap-1 text-sm font-medium">
          {[
            { id: 'general', label: '1. General Info' },
            { id: 'substructure', label: '2. Substructure & Soil' },
            { id: 'superstructure', label: '3. Superstructure' },
            { id: 'roofing', label: '4. Roof System' },
            { id: 'finishes', label: '5. Finishes' },
            { id: 'services', label: '6. Services & External' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700 font-semibold bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Project Classification</label>
                  <select
                    value={data.general?.projectType || 'Residential'}
                    onChange={(e) => handleUpdate('general', 'projectType', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Residential">Residential Building</option>
                    <option value="Commercial">Commercial / Office Complex</option>
                    <option value="Hostel">Multi-Room Student Hostel</option>
                    <option value="School">School / Educational Facility</option>
                    <option value="Hospital">Hospital / Healthcare</option>
                    <option value="Industrial">Light Industrial / Warehouse</option>
                    <option value="Renovation">Renovation / Refurbishment</option>
                    <option value="Other">Other Building Type</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Building Typology</label>
                  <select
                    value={data.general?.buildingType || 'Bungalow'}
                    onChange={(e) => handleUpdate('general', 'buildingType', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Bungalow">Single-Storey Bungalow (Load-bearing masonry)</option>
                    <option value="Duplex">Duplex (2-Storey Residential)</option>
                    <option value="2-storey building">2-Storey Commercial/Hostel Block</option>
                    <option value="3-storey building">3-Storey Block</option>
                    <option value="Multi-storey">Multi-Storey Block (4+ Floors)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Number of Storeys / Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={data.general?.numberOfFloors ?? ''}
                    onChange={(e) => handleUpdate('general', 'numberOfFloors', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    onBlur={(e) => {
                      if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                        handleUpdate('general', 'numberOfFloors', 1);
                      }
                    }}
                    placeholder="1"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">1 = Ground floor only (Bungalow)</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Estimated Gross Floor Area (m²)</label>
                  <FormattedNumberInput
                    value={data.general?.approximateGFA ?? ''}
                    onChange={(val) => handleUpdate('general', 'approximateGFA', val)}
                    onBlur={() => {
                      if (!data.general?.approximateGFA || data.general.approximateGFA < 10) {
                        handleUpdate('general', 'approximateGFA', 220);
                      }
                    }}
                    placeholder="220"
                    maxDecimals={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Total combined floor area</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Total Rooms / Units</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={data.general?.numberOfRooms ?? ''}
                    onChange={(e) => handleUpdate('general', 'numberOfRooms', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    onBlur={(e) => {
                      if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                        handleUpdate('general', 'numberOfRooms', 4);
                      }
                    }}
                    placeholder="4"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Used for doors & windows scaling</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Project Site Location</label>
                  <input
                    type="text"
                    value={data.general?.location ?? ''}
                    onChange={(e) => handleUpdate('general', 'location', e.target.value)}
                    placeholder="e.g. Lekki, Lagos or Port Harcourt, Rivers"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Site Terrain / Ground Condition</label>
                  <select
                    value={data.general?.terrain || 'Normal'}
                    onChange={(e) => handleUpdate('general', 'terrain', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Normal">Normal Dry Firm Ground</option>
                    <option value="Swamp">Swamp / Waterlogged (Niger Delta / Coastal / Dewatering required)</option>
                    <option value="Waterlogged">Seasonally Waterlogged Ground</option>
                    <option value="Coastal">Coastal Sandy Ground</option>
                    <option value="Hilly">Hilly / Sloping Terrain (Excavation cutting required)</option>
                  </select>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Automated Structural Integrity Rules Active:</span>
                  <p className="mt-0.5 text-emerald-800">
                    If 1 Storey / Bungalow is selected, the system automatically suppresses reinforced concrete columns and suspended floor slabs, strictly conforming to the Nigerian BESMM4 standard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSTRUCTURE */}
          {activeTab === 'substructure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Foundation Type</label>
                  <select
                    value={data.substructure?.foundationType || 'Strip foundation'}
                    onChange={(e) => handleUpdate('substructure', 'foundationType', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Strip foundation">Strip Footing (Standard Bungalow & 2-Storey)</option>
                    <option value="Pad foundation">Isolated Pad Footings</option>
                    <option value="Raft foundation">Reinforced Concrete Raft Slab (Port Harcourt / Lekki Soft Soil)</option>
                    <option value="Pile foundation">Bored / Driven Piles & Pile Caps</option>
                    <option value="Combined footing">Combined Footing & Ground Beams</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Ground Floor Construction</label>
                  <select
                    value={data.substructure?.groundFloorConstruction || 'Ground-bearing slab'}
                    onChange={(e) => handleUpdate('substructure', 'groundFloorConstruction', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Ground-bearing slab">Ground-Bearing 150mm Concrete Oversite Bed</option>
                    <option value="Suspended slab">Suspended Ground Slab on Ground Beams</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Foundation Excavation Depth</label>
                  <select
                    value={data.substructure?.foundationDepth || '1.2m'}
                    onChange={(e) => handleUpdate('substructure', 'foundationDepth', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="0.9m">0.9m (Shallow firm soil)</option>
                    <option value="1.2m">1.2m (Standard Nigerian building foundation depth)</option>
                    <option value="1.5m">1.5m (Deep firm strata)</option>
                    <option value="Over 1.5m">Over 1.5m with earth filling</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Basement Floor</label>
                  <select
                    value={data.substructure?.basement || 'No'}
                    onChange={(e) => handleUpdate('substructure', 'basement', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="No">No Basement</option>
                    <option value="Yes">Yes (Includes retaining walls and waterstops)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPERSTRUCTURE */}
          {activeTab === 'superstructure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Superstructure Frame System</label>
                  <select
                    value={data.superstructure?.structuralSystem || 'Load-bearing masonry'}
                    onChange={(e) => handleUpdate('superstructure', 'structuralSystem', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Load-bearing masonry">Load-Bearing Masonry (Standard Bungalow)</option>
                    <option value="Reinforced concrete frame">RC Framed Structure (Columns, Beams & Slabs)</option>
                    <option value="Steel frame">Structural Steel Frame</option>
                    <option value="Mixed">Mixed Masonry & Concrete Frame</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Reinforced Concrete Columns</label>
                  <select
                    value={data.superstructure?.columns || 'No'}
                    onChange={(e) => handleUpdate('superstructure', 'columns', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="No">No (Load-Bearing Masonry - Bungalow)</option>
                    <option value="Yes">Yes (Reinforced Concrete Columns 225x225mm)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Suspended Slabs</label>
                  <select
                    value={data.superstructure?.suspendedSlabs || 'No'}
                    onChange={(e) => handleUpdate('superstructure', 'suspendedSlabs', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="No">No (Single-Storey / Bungalow)</option>
                    <option value="Yes">Yes (150mm Reinforced Concrete First/Second Floor Slab)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Staircase Construction</label>
                  <select
                    value={data.superstructure?.staircase || 'None'}
                    onChange={(e) => handleUpdate('superstructure', 'staircase', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="None">None (Bungalow)</option>
                    <option value="Reinforced concrete">Reinforced Concrete Waist & Steps</option>
                    <option value="Steel">Steel Stringers & Steps</option>
                    <option value="Timber">Timber Staircase</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ROOFING */}
          {activeTab === 'roofing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Roof Geometry</label>
                  <select
                    value={data.roofing?.roofType || 'Hip/Gable combination'}
                    onChange={(e) => handleUpdate('roofing', 'roofType', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Hip/Gable combination">Hip & Gable Combination</option>
                    <option value="Hip">Pure Hip Roof</option>
                    <option value="Gable">Gable Roof (No valley gutters)</option>
                    <option value="Mono-pitch">Mono-pitch / Lean-to Roof</option>
                    <option value="Flat">Flat Roof</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Roof Covering Material</label>
                  <select
                    value={data.roofing?.roofCovering || 'Aluminium longspan'}
                    onChange={(e) => handleUpdate('roofing', 'roofCovering', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aluminium longspan">0.55mm Aluminium Longspan Corrugated Sheets</option>
                    <option value="Stone-coated">Stone-Coated Steel Roof Tiles (Gerard / Milano)</option>
                    <option value="Concrete tiles">Concrete Roofing Tiles</option>
                    <option value="Fibre cement">Fibre Cement Corrugated Sheets</option>
                    <option value="Clay tiles">Clay Tiles</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Roof Structure Carcassing</label>
                  <select
                    value={data.roofing?.roofStructure || 'Timber'}
                    onChange={(e) => handleUpdate('roofing', 'roofStructure', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Timber">Treated Hardwood Timber Trusses</option>
                    <option value="Steel">Light Gauge Steel Trusses</option>
                  </select>
                </div>
              </div>

              {/* Roof Accessories Checklist */}
              <div>
                <label className="block font-semibold text-slate-800 mb-2">Roof Accessories & Details</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'ridge', label: 'Ridge Cap' },
                    { id: 'valleys', label: 'Valley Gutters' },
                    { id: 'hips', label: 'Hips' },
                    { id: 'fascia', label: 'Fascia Board' },
                    { id: 'gutters', label: 'Eaves Gutters' },
                    { id: 'downpipes', label: 'Downpipes' },
                    { id: 'flashings', label: 'Flashing' },
                    { id: 'insulation', label: 'Foil Insulation' },
                  ].map((feat) => {
                    const isChecked = Boolean(data.roofing?.features?.[feat.id as keyof ProjectQuestionnaire['roofing']['features']]);
                    return (
                      <button
                        type="button"
                        key={feat.id}
                        onClick={() => handleToggleRoofFeature(feat.id as any)}
                        className={`p-2 rounded-lg border text-left text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold' 
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <span>{feat.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: FINISHES */}
          {activeTab === 'finishes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Floor Tiling Specification</label>
                  <select
                    value={data.finishes?.floors || 'Porcelain'}
                    onChange={(e) => handleUpdate('finishes', 'floors', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Porcelain">600x600mm Vitrified Porcelain Tiles</option>
                    <option value="Ceramic">400x400mm Glazed Ceramic Tiles</option>
                    <option value="Terrazzo">In-situ Polished Terrazzo</option>
                    <option value="Concrete">Smooth Cement-Sand Screeding</option>
                    <option value="Vinyl">Vinyl / Luxury Vinyl Tiles</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Ceiling Finish</label>
                  <select
                    value={data.finishes?.ceilings || 'POP'}
                    onChange={(e) => handleUpdate('finishes', 'ceilings', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="POP">Plaster of Paris (POP) Suspended Ceiling</option>
                    <option value="PVC">PVC Tongue & Groove Panels</option>
                    <option value="Plasterboard">Gypsum Plasterboard</option>
                    <option value="Suspended">Acoustic Mineral Fiber Tiles</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Wall Finishes</label>
                  <select
                    value={data.finishes?.walls || 'Paint'}
                    onChange={(e) => handleUpdate('finishes', 'walls', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Paint">Internal Emulsion & External Textcote</option>
                    <option value="Tiles">Ceramic Wall Tiles to Full Height</option>
                    <option value="Plaster/render">Smooth Cement-Sand Render Only</option>
                    <option value="Cladding">Stone / Granite Tile Cladding</option>
                    <option value="Combination">Paint with Tile Accents</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Doors Material Specification</label>
                  <select
                    value={data.finishes?.doors || 'Timber'}
                    onChange={(e) => handleUpdate('finishes', 'doors', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Timber">Solid Core Hardwood Flush/Panel Doors</option>
                    <option value="Steel">Heavy-Duty Armoured Steel Security Doors</option>
                    <option value="Aluminium">Aluminium Glazed Doors</option>
                    <option value="Glass">Frameless Tempered Glass Doors</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Windows Specification</label>
                  <select
                    value={data.finishes?.windows || 'Aluminium casement'}
                    onChange={(e) => handleUpdate('finishes', 'windows', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Aluminium casement">Aluminium Casement Windows with Burglary Proof</option>
                    <option value="Aluminium sliding">Aluminium Sliding Windows with Netting</option>
                    <option value="UPVC">UPVC Projected Casement Windows</option>
                    <option value="Curtain wall">Structural Glazed Curtain Wall</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SERVICES & EXTERNAL */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Electrical Installation Scope</label>
                  <select
                    value={data.services?.electrical || 'Included'}
                    onChange={(e) => handleUpdate('services', 'electrical', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Included">Include Full Electrical (Conduit, Cables, Outlets & Panels)</option>
                    <option value="Separate contract">Separate Specialist Subcontract</option>
                    <option value="Excluded">Excluded from this Bill</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Plumbing & Sanitary Scope</label>
                  <select
                    value={data.services?.plumbing || 'Included'}
                    onChange={(e) => handleUpdate('services', 'plumbing', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Included">Include Full Plumbing & Sanitary Appliances</option>
                    <option value="Separate contract">Separate Specialist Subcontract</option>
                    <option value="Excluded">Excluded from this Bill</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">External Works & Paving</label>
                  <select
                    value={data.services?.externalWorks || 'Included'}
                    onChange={(e) => handleUpdate('services', 'externalWorks', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Included">Include Interlocking Paving Stones & Fencing</option>
                    <option value="Excluded">Excluded</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Site Drainage & Soakaway</label>
                  <select
                    value={data.services?.drainage || 'Included'}
                    onChange={(e) => handleUpdate('services', 'drainage', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Included">Include Septic Tank, Soakaway Pit & Perimeter Drains</option>
                    <option value="Excluded">Excluded</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Preliminary Parametric Estimate: Generates assumed geometric quantities from questionnaire specifications (Not a Drawing Takeoff).</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => {
                const sanitized = getSanitizedData();
                onSaveAndGenerate(sanitized, 'save_only');
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Save Parameters Only
            </button>
            <button
              onClick={() => {
                const sanitized = getSanitizedData();
                onSaveAndGenerate(sanitized, 'deterministic');
              }}
              className="flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              title="Generate a preliminary parametric estimate based purely on questionnaire parameters"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Preliminary Parametric Estimate</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
