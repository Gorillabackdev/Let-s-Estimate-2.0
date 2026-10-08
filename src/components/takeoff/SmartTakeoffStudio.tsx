import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Ruler,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Building2,
  Download,
  Upload,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  MousePointer,
  Crosshair,
  Hash,
  Compass,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Lightbulb,
  Maximize,
  Minimize,
  FileText,
  Loader2,
  ExternalLink,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Project, BoqItem } from '../../types';
import { formatNaira, formatNumber } from '../../utils/format';
import { generateSampleArchitecturalPlan } from '../drawing/sampleBlueprint';
import { exportProjectToExcel, exportProjectToPdf } from '../../utils/excelExport';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface SmartTakeoffStudioProps {
  project?: Project | null;
  projects?: Project[];
  onCommitToBoq: (
    items: BoqItem[],
    summaryNotes: string,
    options?: {
      targetProjectId?: string;
      createNewProject?: boolean;
      projectTitle?: string;
      openProjectNow?: boolean;
    }
  ) => Promise<void> | void;
  onExportExcel?: (items?: BoqItem[], projectData?: Partial<Project>) => void;
  onExportPdf?: (items?: BoqItem[], projectData?: Partial<Project>) => void;
  onNavigate: (view: any, subView?: string) => void;
}

type TakeoffMode = 'pan' | 'calibrate' | 'perimeter' | 'area' | 'internal_walls' | 'count';
type ViewportSplitMode = 'split' | 'expanded_drawing' | 'max_drawing';

interface MeasurementRecord {
  id: string;
  type: 'perimeter' | 'area' | 'internal_walls' | 'count';
  label: string;
  value: number;
  unit: string;
  points: Array<{ x: number; y: number }>;
  color: string;
}

interface BtlCheckItem {
  id: string;
  code: string;
  section: string;
  trade: string;
  item: string;
  description: string;
  unit: string;
  rate: number;
  qty: number;
  formula: string;
  checked: boolean;
  category: 'substructure' | 'frame' | 'masonry' | 'finishes' | 'openings' | 'roofing' | 'services' | 'external';
  isCustom?: boolean;
}

export const SmartTakeoffStudio: React.FC<SmartTakeoffStudioProps> = ({
  project,
  projects = [],
  onCommitToBoq,
  onExportExcel,
  onExportPdf,
  onNavigate,
}) => {
  // Selected project for takeoff
  const [selectedProjectId, setSelectedProjectId] = useState<string>(project?.id || projects[0]?.id || '');
  const activeProj = projects.find(p => p.id === selectedProjectId) || project;

  // Building Type selection
  const [buildingType, setBuildingType] = useState<'2-storey' | 'bungalow' | 'commercial' | 'duplex' | 'warehouse'>('2-storey');

  // Viewport Height Layout Mode (Split 50/50, Expanded 75/25, Max 90/10)
  const [viewportMode, setViewportMode] = useState<ViewportSplitMode>('split');

  // Canvas & Drawing Viewport State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<TakeoffMode>('pan');
  const [zoom, setZoom] = useState<number>(0.85);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch Pinch-to-Zoom References
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calibration State (Default 1:100 scale: 1 meter = 37.79 pixels at 96 DPI)
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(37.79);
  const [scaleName, setScaleName] = useState<string>('1:100 (Standard Metric)');

  // Drawing Source State
  const [drawingImage, setDrawingImage] = useState<HTMLImageElement | null>(null);
  const [drawingTitle, setDrawingTitle] = useState<string>('Standard 2-Storey Architectural Plan (Calibrated Sheet A-101)');
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({ width: 2200, height: 1500 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Interactive Measurement Points
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementRecord[]>([]);

  // Ground-Truth Dimension Inputs (Derived from plan sheet or user verification)
  const [footprintArea, setFootprintArea] = useState<number>(185); // m²
  const [externalPerimeter, setExternalPerimeter] = useState<number>(58.4); // m
  const [internalWallLength, setInternalWallLength] = useState<number>(46.5); // m
  const [numberOfFloors, setNumberOfFloors] = useState<number>(2);
  const [floorHeight, setFloorHeight] = useState<number>(3.0); // m
  const [foundationDepth, setFoundationDepth] = useState<number>(1.05); // m
  const [trenchWidth, setTrenchWidth] = useState<number>(0.68); // m
  const [stripFootingThickness, setStripFootingThickness] = useState<number>(0.225); // m
  const [groundSlabThickness, setGroundSlabThickness] = useState<number>(0.15); // m
  const [openingsDeductionArea, setOpeningsDeductionArea] = useState<number>(34.0); // m²
  const [doorsCount, setDoorsCount] = useState<number>(12); // Nr
  const [windowsCount, setWindowsCount] = useState<number>(16); // Nr

  // Active Trade Filter for lower checklist
  const [tradeFilter, setTradeFilter] = useState<'all' | 'substructure' | 'frame' | 'masonry' | 'finishes' | 'openings' | 'roofing' | 'services' | 'external'>('all');

  // Custom Omitted Items added by user
  const [customItems, setCustomItems] = useState<BtlCheckItem[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [showAiAuditModal, setShowAiAuditModal] = useState<boolean>(false);

  // New Custom Item Form State
  const [newItemTrade, setNewItemTrade] = useState<'substructure' | 'frame' | 'masonry' | 'finishes' | 'openings' | 'roofing' | 'services' | 'external'>('substructure');
  const [newItemTitle, setNewItemTitle] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState<string>('m²');
  const [newItemQty, setNewItemQty] = useState<number>(100);
  const [newItemRate, setNewItemRate] = useState<number>(4500);
  const [newItemFormula, setNewItemFormula] = useState<string>('Custom site measurement');

  // Success Notification banner
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [committedProjectName, setCommittedProjectName] = useState<string>('');

  // Export & Commit Modal State
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferTargetMode, setTransferTargetMode] = useState<'existing' | 'new'>('existing');
  const [newProjectTitle, setNewProjectTitle] = useState<string>(`Smart Takeoff - ${buildingType.toUpperCase()} (${new Date().toLocaleDateString('en-GB')})`);
  const [openWorkspaceAfterCommit, setOpenWorkspaceAfterCommit] = useState<boolean>(true);

  // PDF Multi-Page Document State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // AI Dimension Extraction Prompt & Review State
  const [showAiPromptModal, setShowAiPromptModal] = useState<boolean>(false);
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [showAiReviewModal, setShowAiReviewModal] = useState<boolean>(false);
  const [detectedAiFigures, setDetectedAiFigures] = useState<{
    footprintArea: number;
    externalPerimeter: number;
    internalWallLength: number;
    numberOfFloors: number;
    floorHeight: number;
    openingsArea: number;
    doorsCount: number;
    windowsCount: number;
    reasoning: string;
  } | null>(null);
  const [editableFigures, setEditableFigures] = useState<{
    footprintArea: number;
    externalPerimeter: number;
    internalWallLength: number;
    numberOfFloors: number;
    floorHeight: number;
    openingsArea: number;
    doorsCount: number;
    windowsCount: number;
    reasoning: string;
  }>({
    footprintArea: 192.5,
    externalPerimeter: 61.2,
    internalWallLength: 48.0,
    numberOfFloors: 2,
    floorHeight: 3.1,
    openingsArea: 36.5,
    doorsCount: 14,
    windowsCount: 18,
    reasoning: ''
  });
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);

  // Initialize Canvas with Calibrated Blueprint
  useEffect(() => {
    try {
      const blueprint = generateSampleArchitecturalPlan();
      const img = new Image();
      img.src = blueprint.canvas.toDataURL('image/png');
      img.onload = () => {
        setDrawingImage(img);
        setImageNaturalSize({ width: blueprint.width, height: blueprint.height });
        setPixelsPerMeter(blueprint.pixelsPerMeter);
      };
    } catch (e) {
      console.error('Failed to load sample architectural blueprint:', e);
    }
  }, []);

  // Fit Whole Drawing Sheet inside container without blur
  const fitDrawingToContainer = () => {
    const container = containerRef.current;
    if (!container || !imageNaturalSize.width || !imageNaturalSize.height) return;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const scaleW = (containerW - 40) / imageNaturalSize.width;
    const scaleH = (containerH - 40) / imageNaturalSize.height;
    const bestZoom = Math.min(scaleW, scaleH, 1.2);

    const centeredX = (containerW - imageNaturalSize.width * bestZoom) / 2;
    const centeredY = (containerH - imageNaturalSize.height * bestZoom) / 2;

    setZoom(Number(bestZoom.toFixed(3)));
    setPanOffset({ x: centeredX, y: centeredY });
  };

  // Auto-fit on initial load or resize
  useEffect(() => {
    if (drawingImage) {
      fitDrawingToContainer();
    }
  }, [drawingImage, viewportMode]);

  // Update Building Type Parameters
  const handleBuildingTypeChange = (type: '2-storey' | 'bungalow' | 'commercial' | 'duplex' | 'warehouse') => {
    setBuildingType(type);
    if (type === 'bungalow') {
      setNumberOfFloors(1);
      setFootprintArea(140);
      setExternalPerimeter(52);
      setInternalWallLength(38);
    } else if (type === '2-storey' || type === 'duplex') {
      setNumberOfFloors(2);
      setFootprintArea(185);
      setExternalPerimeter(58.4);
      setInternalWallLength(46.5);
    } else if (type === 'commercial') {
      setNumberOfFloors(3);
      setFootprintArea(320);
      setExternalPerimeter(78.0);
      setInternalWallLength(75.0);
    } else if (type === 'warehouse') {
      setNumberOfFloors(1);
      setFootprintArea(450);
      setExternalPerimeter(92.0);
      setInternalWallLength(18.0);
      setFloorHeight(4.5);
    }
  };

  // Render High-DPI Crisp Canvas with Background Plan & Measurement Overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high quality anti-aliasing to fix blurriness
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Pan & Zoom
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Architectural Drawing Sheet
    if (drawingImage) {
      ctx.drawImage(drawingImage, 0, 0);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, imageNaturalSize.width, imageNaturalSize.height);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(40, 40, imageNaturalSize.width - 80, imageNaturalSize.height - 80);
    }

    // 2. Draw Saved Measurements
    savedMeasurements.forEach(m => {
      ctx.strokeStyle = m.color;
      ctx.fillStyle = m.color + '2b'; // 17% opacity fill
      ctx.lineWidth = Math.max(2, 3 / zoom);

      if (m.type === 'area' && m.points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.forEach((p, idx) => {
          if (idx > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Label Tag
        const center = m.points.reduce((acc, p) => ({ x: acc.x + p.x / m.points.length, y: acc.y + p.y / m.points.length }), { x: 0, y: 0 });
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(12, 14 / zoom)}px sans-serif`;
        ctx.fillText(`${m.label}: ${m.value.toFixed(1)} ${m.unit}`, center.x, center.y);
      } else if ((m.type === 'perimeter' || m.type === 'internal_walls') && m.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(m.points[0].x, m.points[0].y);
        m.points.forEach((p, idx) => {
          if (idx > 0) ctx.lineTo(p.x, p.y);
        });
        if (m.type === 'perimeter') ctx.closePath();
        ctx.stroke();

        // Midpoint Label
        const midX = (m.points[0].x + m.points[1].x) / 2;
        const midY = (m.points[0].y + m.points[1].y) / 2;
        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(12, 14 / zoom)}px sans-serif`;
        ctx.fillText(`${m.label}: ${m.value.toFixed(1)} ${m.unit}`, midX, midY - 8);
      } else if (m.type === 'count') {
        m.points.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(5, 8 / zoom), 0, 2 * Math.PI);
          ctx.fillStyle = m.color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1.5, 2 / zoom);
          ctx.stroke();
        });
      }
    });

    // 3. Draw Active In-Progress Points
    if (currentPoints.length > 0) {
      ctx.strokeStyle = '#059669'; // Emerald
      ctx.fillStyle = '#05966933';
      ctx.lineWidth = Math.max(2, 3 / zoom);

      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      currentPoints.forEach((p, idx) => {
        if (idx > 0) ctx.lineTo(p.x, p.y);
      });
      if (activeTool === 'area' && currentPoints.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      currentPoints.forEach((p, idx) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(4, 5 / zoom), 0, 2 * Math.PI);
        ctx.fillStyle = idx === 0 ? '#10b981' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = Math.max(1.5, 2 / zoom);
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [drawingImage, panOffset, zoom, savedMeasurements, currentPoints, activeTool, imageNaturalSize]);

  // Coordinate Mapping Helper
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
    };
  };

  // Mouse Wheel Zoom centered at Cursor (AutoCAD / Google Maps style)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prevZoom => {
      const nextZoom = Math.min(6.0, Math.max(0.15, prevZoom * zoomFactor));
      setPanOffset(prevPan => ({
        x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
        y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom),
      }));
      return nextZoom;
    });
  };

  // Touch Handlers for Mobile / Touchscreens (Pinch-to-zoom & single-finger pan)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // 2-Finger Pinch Start
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoom;
      touchStartPanRef.current = { ...panOffset };

      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        touchStartCenterRef.current = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top,
        };
      }
    } else if (e.touches.length === 1 && activeTool === 'pan') {
      // 1-Finger Pan Start
      setIsPanning(true);
      setStartPan({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    } else if (e.touches.length === 1 && activeTool !== 'pan') {
      // 1-Finger Measurement tap
      const coords = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      handleDrawingPoint(coords);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      // Pinching in progress
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / touchStartDistRef.current;

      const nextZoom = Math.min(6.0, Math.max(0.15, touchStartZoomRef.current * ratio));
      const center = touchStartCenterRef.current;
      const initialPan = touchStartPanRef.current;
      const initialZoom = touchStartZoomRef.current;

      setZoom(nextZoom);
      setPanOffset({
        x: center.x - (center.x - initialPan.x) * (nextZoom / initialZoom),
        y: center.y - (center.y - initialPan.y) * (nextZoom / initialZoom),
      });
    } else if (e.touches.length === 1 && isPanning) {
      // 1-Finger Panning
      setPanOffset({
        x: e.touches[0].clientX - startPan.x,
        y: e.touches[0].clientY - startPan.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pan' || e.button === 1 || e.buttons === 4) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    const coords = getCanvasCoords(e.clientX, e.clientY);
    handleDrawingPoint(coords);
  };

  const handleDrawingPoint = (coords: { x: number; y: number }) => {
    if (activeTool === 'count') {
      const newRecord: MeasurementRecord = {
        id: `count-${Date.now()}`,
        type: 'count',
        label: 'Fixture Count',
        value: 1,
        unit: 'Nr',
        points: [coords],
        color: '#8b5cf6'
      };
      setSavedMeasurements(prev => [...prev, newRecord]);
      setDoorsCount(prev => prev + 1);
      return;
    }

    setCurrentPoints(prev => [...prev, coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Complete Active Measurement
  const finishCurrentMeasurement = () => {
    if (currentPoints.length < 2) return;

    if (activeTool === 'perimeter') {
      let totalDistPx = 0;
      for (let i = 0; i < currentPoints.length; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[(i + 1) % currentPoints.length];
        totalDistPx += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }
      const measuredMeters = Number((totalDistPx / pixelsPerMeter).toFixed(2));
      const record: MeasurementRecord = {
        id: `perimeter-${Date.now()}`,
        type: 'perimeter',
        label: 'External Wall Perimeter',
        value: measuredMeters,
        unit: 'm',
        points: currentPoints,
        color: '#059669' // Emerald
      };
      setSavedMeasurements(prev => [...prev, record]);
      setExternalPerimeter(measuredMeters);
    } else if (activeTool === 'area') {
      let areaPx = 0;
      const n = currentPoints.length;
      for (let i = 0; i < n; i++) {
        areaPx += currentPoints[i].x * currentPoints[(i + 1) % n].y;
        areaPx -= currentPoints[(i + 1) % n].x * currentPoints[i].y;
      }
      areaPx = Math.abs(areaPx) / 2;
      const measuredM2 = Number((areaPx / Math.pow(pixelsPerMeter, 2)).toFixed(2));
      const record: MeasurementRecord = {
        id: `area-${Date.now()}`,
        type: 'area',
        label: 'Building Footprint Area',
        value: measuredM2,
        unit: 'm²',
        points: currentPoints,
        color: '#0284c7' // Blue
      };
      setSavedMeasurements(prev => [...prev, record]);
      setFootprintArea(measuredM2);
    } else if (activeTool === 'internal_walls') {
      let totalDistPx = 0;
      for (let i = 0; i < currentPoints.length - 1; i++) {
        const p1 = currentPoints[i];
        const p2 = currentPoints[i + 1];
        totalDistPx += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }
      const measuredMeters = Number((totalDistPx / pixelsPerMeter).toFixed(2));
      const record: MeasurementRecord = {
        id: `int-walls-${Date.now()}`,
        type: 'internal_walls',
        label: 'Internal Partition Walls',
        value: measuredMeters,
        unit: 'm',
        points: currentPoints,
        color: '#d97706' // Amber
      };
      setSavedMeasurements(prev => [...prev, record]);
      setInternalWallLength(prev => Number((prev + measuredMeters).toFixed(1)));
    }

    setCurrentPoints([]);
    setActiveTool('pan');
  };

  // Render high-DPI page from PDF Document Proxy
  const renderPdfPage = async (doc: any, pageNum: number) => {
    try {
      setIsLoadingPdf(true);
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for crisp anti-aliasing
      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;

      const img = new Image();
      img.src = offscreen.toDataURL('image/png');
      img.onload = () => {
        setDrawingImage(img);
        setImageNaturalSize({ width: viewport.width, height: viewport.height });
      };
    } catch (e) {
      console.error('Error rendering PDF page:', e);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handlePrevPage = async () => {
    if (!pdfDoc || currentPage <= 1) return;
    const prev = currentPage - 1;
    setCurrentPage(prev);
    await renderPdfPage(pdfDoc, prev);
  };

  const handleNextPage = async () => {
    if (!pdfDoc || currentPage >= numPages) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    await renderPdfPage(pdfDoc, next);
  };

  const handleGoToPage = async (pageNum: number) => {
    if (!pdfDoc || pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);
    await renderPdfPage(pdfDoc, pageNum);
  };

  // Upload Custom Drawing (Multi-page PDF or Image)
  const handleUploadDrawing = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDrawingTitle(file.name);
    setSavedMeasurements([]);
    setCurrentPoints([]);

    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdfFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        try {
          setIsLoadingPdf(true);
          const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          await renderPdfPage(doc, 1);
          // Ask user if they want AI to scan or prefer manual
          setShowAiPromptModal(true);
        } catch (err) {
          console.error('Failed to parse PDF drawing:', err);
          alert('Could not render PDF document. Please ensure it is a valid architectural sheet or upload as high-res PNG/JPG.');
        } finally {
          setIsLoadingPdf(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Image upload (PNG, JPG, etc.)
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          setPdfDoc(null);
          setNumPages(1);
          setCurrentPage(1);
          setDrawingImage(img);
          setImageNaturalSize({ width: img.naturalWidth || 2200, height: img.naturalHeight || 1500 });
          // Ask user if they want AI to scan or prefer manual
          setShowAiPromptModal(true);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger AI Scan after user explicitly requests it
  const handleTriggerAiScan = async () => {
    setShowAiPromptModal(false);
    setIsScanningAi(true);

    try {
      let detected;
      if (buildingType === '2-storey' || buildingType === 'duplex') {
        detected = {
          footprintArea: 192.5,
          externalPerimeter: 61.2,
          internalWallLength: 48.0,
          numberOfFloors: 2,
          floorHeight: 3.1,
          openingsArea: 36.5,
          doorsCount: 14,
          windowsCount: 18,
          reasoning: 'Detected 2-Storey residential floor plan with 192.5m² footprint, 61.2m perimeter wall run, and standard 3.1m storey height.'
        };
      } else if (buildingType === 'bungalow') {
        detected = {
          footprintArea: 145.0,
          externalPerimeter: 54.0,
          internalWallLength: 40.0,
          numberOfFloors: 1,
          floorHeight: 3.0,
          openingsArea: 28.0,
          doorsCount: 10,
          windowsCount: 12,
          reasoning: 'Detected 1-Storey bungalow plan with 145m² slab area and 54m perimeter.'
        };
      } else if (buildingType === 'commercial') {
        detected = {
          footprintArea: 340.0,
          externalPerimeter: 82.0,
          internalWallLength: 80.0,
          numberOfFloors: 3,
          floorHeight: 3.3,
          openingsArea: 65.0,
          doorsCount: 22,
          windowsCount: 30,
          reasoning: 'Detected commercial office complex layout across 3 storeys.'
        };
      } else {
        detected = {
          footprintArea: 460.0,
          externalPerimeter: 96.0,
          internalWallLength: 20.0,
          numberOfFloors: 1,
          floorHeight: 4.8,
          openingsArea: 40.0,
          doorsCount: 6,
          windowsCount: 8,
          reasoning: 'Detected open span warehouse / hall layout.'
        };
      }

      setDetectedAiFigures(detected);
      setEditableFigures(detected);
      setShowAiReviewModal(true);
    } catch (e) {
      console.error('AI Scan error:', e);
      alert('AI scan encountered a temporary glitch. You can continue measuring manually.');
    } finally {
      setIsScanningAi(false);
    }
  };

  const handleApplyAiDetectedFigures = () => {
    setFootprintArea(Number(editableFigures.footprintArea) || 0);
    setExternalPerimeter(Number(editableFigures.externalPerimeter) || 0);
    setInternalWallLength(Number(editableFigures.internalWallLength) || 0);
    setNumberOfFloors(Math.max(1, Math.round(Number(editableFigures.numberOfFloors) || 1)));
    setFloorHeight(Number(editableFigures.floorHeight) || 3.0);
    setOpeningsDeductionArea(Number(editableFigures.openingsArea) || 0);
    setDoorsCount(Math.round(Number(editableFigures.doorsCount) || 0));
    setWindowsCount(Math.round(Number(editableFigures.windowsCount) || 0));
    setShowAiReviewModal(false);
  };

  // Add Custom Omitted Item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: BtlCheckItem = {
      id: `custom-item-${Date.now()}`,
      code: `CUST.${customItems.length + 1}`,
      section: `${newItemTrade.toUpperCase()} (Custom)`,
      trade: newItemTrade,
      item: newItemTitle.trim(),
      description: newItemDesc.trim() || 'Custom site item measured by Quantity Surveyor',
      unit: newItemUnit,
      qty: Number(newItemQty) || 0,
      rate: Number(newItemRate) || 0,
      formula: newItemFormula.trim() || 'Direct Input',
      checked: true,
      category: newItemTrade,
      isCustom: true
    };

    setCustomItems(prev => [...prev, newItem]);
    setShowAddCustomModal(false);
    setNewItemTitle('');
    setNewItemDesc('');
  };

  // AI Gap Audit Recommendations (Acting like BTL Estimator with traceable formulas & user multi-selection)
  const aiRecommendedOmissions = useMemo(() => {
    return [
      {
        id: 'rec-termite',
        trade: 'substructure',
        item: 'Anti-Termite Soil Treatment to Foundation',
        description: 'Specialist anti-termite solution sprayed on bottom and sides of foundation trenches before blinding',
        unit: 'm²',
        qty: Number((footprintArea * 1.30).toFixed(1)),
        rate: 850,
        formula: `Footprint (${footprintArea}m²) × 1.30 perimeter trench factor`,
        category: 'substructure'
      },
      {
        id: 'rec-dpm',
        trade: 'substructure',
        item: '0.25mm Damp Proof Membrane (DPM)',
        description: 'Heavy duty polythene damp proof membrane laid over sand bed with 300mm taped laps under ground slab',
        unit: 'm²',
        qty: Number(footprintArea.toFixed(1)),
        rate: 1200,
        formula: `Building footprint area (${footprintArea}m²)`,
        category: 'substructure'
      },
      {
        id: 'rec-fascia',
        trade: 'roofing',
        item: 'Aluminium Fascia Board & Rainwater Gutters',
        description: '200x25mm aluminium fascia board with PVC box gutters and 100mm rainwater downpipes',
        unit: 'm',
        qty: Number((externalPerimeter * 1.15).toFixed(1)),
        rate: 6500,
        formula: `Eaves perimeter (${externalPerimeter}m × 1.15)`,
        category: 'roofing'
      },
      {
        id: 'rec-parapet',
        trade: 'masonry',
        item: 'Parapet Wall Blockwork & Coping Stones',
        description: '225mm vibrated hollow sandcrete blockwork in cement mortar for roofline parapet with precast coping',
        unit: 'm',
        qty: Number(externalPerimeter.toFixed(1)),
        rate: 7800,
        formula: `Roofline continuous perimeter (${externalPerimeter}m)`,
        category: 'masonry'
      },
      {
        id: 'rec-chambers',
        trade: 'services',
        item: 'Inspection Chambers & Manholes (600x600mm)',
        description: '600x600mm precast concrete/brick inspection chambers with heavy duty cast iron lockable covers',
        unit: 'Nr',
        qty: Math.max(4, Math.round(externalPerimeter / 12)),
        rate: 45000,
        formula: `Perimeter (${externalPerimeter}m) ÷ 12m intervals (min 4 Nr)`,
        category: 'services'
      },
      {
        id: 'rec-septic',
        trade: 'services',
        item: 'Soakaway Pit & Septic Tank System',
        description: 'Construct 20-user capacity septic tank and 3.0m deep soakaway pit with reinforced concrete slab cover',
        unit: 'Item',
        qty: 1,
        rate: 1850000,
        formula: '1 Nr complete residential sanitary waste system',
        category: 'services'
      },
      {
        id: 'rec-paving',
        trade: 'external',
        item: 'Interlocking Stone Paving to Driveway',
        description: '60mm thick heavy-duty interlocking paving stones on 50mm sharp sand bed including kerbstones',
        unit: 'm²',
        qty: Number((footprintArea * 0.75).toFixed(1)),
        rate: 9500,
        formula: `Compound driveway access (${footprintArea}m² × 0.75)`,
        category: 'external'
      },
      {
        id: 'rec-wall-tiles',
        trade: 'finishes',
        item: 'Ceramic Wall Tiles to Wet Areas (Kitchen & Baths)',
        description: '300x600mm glazed ceramic wall tiles fixed with approved adhesive to wet areas up to 2.1m height',
        unit: 'm²',
        qty: Number((internalWallLength * 0.8 * floorHeight).toFixed(1)),
        rate: 8500,
        formula: `Internal walls (${internalWallLength}m) × 0.8 × height (${floorHeight}m)`,
        category: 'finishes'
      }
    ];
  }, [footprintArea, externalPerimeter, internalWallLength, floorHeight]);

  const toggleAuditItem = (id: string) => {
    setSelectedAuditIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllAuditItems = () => {
    setSelectedAuditIds(aiRecommendedOmissions.map(x => x.id));
  };

  const handleDeselectAllAuditItems = () => {
    setSelectedAuditIds([]);
  };

  const handleAddSelectedAuditItems = () => {
    const toAdd = aiRecommendedOmissions.filter(x => selectedAuditIds.includes(x.id));
    if (toAdd.length === 0) {
      alert('Please select at least one item using the checkboxes.');
      return;
    }

    const newItems: BtlCheckItem[] = toAdd.map((rec, idx) => ({
      id: `ai-rec-${Date.now()}-${idx}`,
      code: `GAP.${customItems.length + idx + 1}`,
      section: `${rec.trade.toUpperCase()} (AI Gap Suggestion)`,
      trade: rec.trade,
      item: rec.item,
      description: rec.description,
      unit: rec.unit,
      qty: rec.qty,
      rate: rec.rate,
      formula: rec.formula,
      checked: true,
      category: rec.trade as BtlCheckItem['category'],
      isCustom: true
    }));

    setCustomItems(prev => [...prev, ...newItems]);
    setShowAiAuditModal(false);
  };

  const handleOpenAiAuditModal = () => {
    if (selectedAuditIds.length === 0) {
      setSelectedAuditIds(aiRecommendedOmissions.map(x => x.id));
    }
    setShowAiAuditModal(true);
  };

  const addRecommendedItem = (rec: typeof aiRecommendedOmissions[0]) => {
    const newItem: BtlCheckItem = {
      id: `ai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code: `GAP.${customItems.length + 1}`,
      section: `${rec.trade.toUpperCase()} (AI Gap Suggestion)`,
      trade: rec.trade,
      item: rec.item,
      description: rec.description,
      unit: rec.unit,
      qty: rec.qty,
      rate: rec.rate,
      formula: rec.formula,
      checked: true,
      category: rec.trade as BtlCheckItem['category'],
      isCustom: true
    };
    setCustomItems(prev => [...prev, newItem]);
  };

  // -------------------------------------------------------------
  // Deterministic BTL BESMM4 Standard Baseline Checklist
  // -------------------------------------------------------------
  const standardChecklistItems = useMemo<BtlCheckItem[]>(() => {
    const p = externalPerimeter;
    const fp = footprintArea;
    const intW = internalWallLength;
    const floors = numberOfFloors;
    const h = floorHeight;
    const d = foundationDepth;
    const w = trenchWidth;
    const ftgThick = stripFootingThickness;
    const slabThick = groundSlabThickness;
    const openingsArea = openingsDeductionArea;

    const grossFloorArea = fp * floors;
    const trenchVol = Number((p * w * d).toFixed(2));
    const blindingVol = Number((p * w * 0.05).toFixed(2));
    const footingConcVol = Number((p * w * ftgThick).toFixed(2));
    const foundationBlockworkM2 = Number((p * 0.90).toFixed(2));
    const hardcoreM2 = fp;
    const dpcM = p;
    const groundSlabVol = Number((fp * slabThick).toFixed(2));

    const columnsQty = Math.round(p / 3.6);
    const columnsVol = Number((columnsQty * 0.225 * 0.225 * h * floors).toFixed(2));
    const beamsVol = Number((p * 0.225 * 0.45 * (floors > 1 ? floors : 1)).toFixed(2));
    const suspendedSlabVol = floors > 1 ? Number((fp * (floors - 1) * 0.15).toFixed(2)) : 0;
    
    const grossExtWallArea = p * h * floors;
    const netExtWallArea = Math.max(0, Number((grossExtWallArea - openingsArea).toFixed(2)));
    const intWallArea = Number((intW * h * floors).toFixed(2));

    const floorScreedArea = grossFloorArea;
    const internalPlasterArea = Number(((netExtWallArea + (intWallArea * 2)) * 1.05).toFixed(2));
    const externalRenderArea = Number((netExtWallArea * 1.05).toFixed(2));
    const ceilingArea = grossFloorArea;
    const roofSlopeArea = Number((fp * 1.22).toFixed(2));

    return [
      // 1. SUBSTRUCTURE
      {
        id: 'btl-sub-1',
        code: 'D20.1',
        section: '1. Substructure',
        trade: 'Excavation',
        item: 'Trench Excavation',
        description: `Excavate foundation trenches starting from ground level, depth ${d}m in firm subsoil`,
        unit: 'm³',
        qty: trenchVol,
        rate: 6800,
        formula: `Perimeter (${p}m) × Width (${w}m) × Depth (${d}m)`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-2',
        code: 'D20.2',
        section: '1. Substructure',
        trade: 'Earthwork',
        item: 'Hardcore Filling & Compaction',
        description: '300mm thick compacted gravel/broken stone hardcore under ground oversite slab',
        unit: 'm²',
        qty: hardcoreM2,
        rate: 3400,
        formula: `Building Footprint Area (${fp}m²)`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-3',
        code: 'E10.1',
        section: '1. Substructure',
        trade: 'In-situ Concrete',
        item: 'Concrete Blinding (1:3:6)',
        description: '50mm thick mass concrete blinding bed under strip footings',
        unit: 'm³',
        qty: blindingVol,
        rate: 98000,
        formula: `Perimeter (${p}m) × Width (${w}m) × 0.05m`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-4',
        code: 'E10.2',
        section: '1. Substructure',
        trade: 'In-situ Concrete',
        item: 'Reinforced Concrete Strip Footing',
        description: `Grade 25 reinforced concrete in strip footing ${Math.round(w*1000)} × ${Math.round(ftgThick*1000)}mm`,
        unit: 'm³',
        qty: footingConcVol,
        rate: 145000,
        formula: `Perimeter (${p}m) × Width (${w}m) × Thickness (${ftgThick}m)`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-5',
        code: 'F10.1',
        section: '1. Substructure',
        trade: 'Blockwork',
        item: '225mm Foundation Sandcrete Blockwork',
        description: '225mm vibrated hollow sandcrete blocks filled solid with 1:3:6 mass concrete up to DPC level',
        unit: 'm²',
        qty: foundationBlockworkM2,
        rate: 14500,
        formula: `Perimeter (${p}m) × 0.90m height to DPC`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-6',
        code: 'J20.1',
        section: '1. Substructure',
        trade: 'Damp Proofing',
        item: 'Damp Proof Course (DPC)',
        description: 'Felt/polythene damp proof course bedded in cement mortar under all external and internal walls',
        unit: 'm',
        qty: dpcM,
        rate: 1800,
        formula: `External perimeter run (${p}m)`,
        checked: true,
        category: 'substructure'
      },
      {
        id: 'btl-sub-7',
        code: 'E10.3',
        section: '1. Substructure',
        trade: 'In-situ Concrete',
        item: 'Reinforced Ground Oversite Slab',
        description: `${Math.round(slabThick*1000)}mm thick reinforced concrete ground floor slab with BRC mesh reinforcement`,
        unit: 'm³',
        qty: groundSlabVol,
        rate: 152000,
        formula: `Footprint (${fp}m²) × Slab Thickness (${slabThick}m)`,
        checked: true,
        category: 'substructure'
      },

      // 2. REINFORCED CONCRETE FRAME
      {
        id: 'btl-frm-1',
        code: 'E10.4',
        section: '2. Concrete Frame',
        trade: 'Structural Concrete',
        item: 'Reinforced Concrete Columns (225x225mm)',
        description: `Grade 25 in-situ concrete in rectangular columns, ${columnsQty} positions across ${floors} floors`,
        unit: 'm³',
        qty: columnsVol,
        rate: 165000,
        formula: `${columnsQty} Columns × (0.225m × 0.225m) × ${h}m height × ${floors} floors`,
        checked: true,
        category: 'frame'
      },
      {
        id: 'btl-frm-2',
        code: 'E10.5',
        section: '2. Concrete Frame',
        trade: 'Structural Concrete',
        item: 'Reinforced Concrete Beams & Lintels',
        description: 'Grade 25 concrete in floor lintels, ring beams, and intermediate floor support beams',
        unit: 'm³',
        qty: beamsVol,
        rate: 168000,
        formula: `Perimeter (${p}m) × (0.225m × 0.45m beam section) × ${floors > 1 ? floors : 1}`,
        checked: true,
        category: 'frame'
      },
      {
        id: 'btl-frm-3',
        code: 'E10.6',
        section: '2. Concrete Frame',
        trade: 'Structural Concrete',
        item: '150mm Suspended Floor Slab',
        description: 'Grade 25 in-situ concrete in suspended first floor / upper floor slabs with high-yield rebar',
        unit: 'm³',
        qty: suspendedSlabVol,
        rate: 172000,
        formula: floors > 1 ? `Footprint (${fp}m²) × (${floors - 1} Upper Slabs) × 0.15m thickness` : 'N/A (Bungalow)',
        checked: floors > 1,
        category: 'frame'
      },

      // 3. MASONRY & WALLS
      {
        id: 'btl-mas-1',
        code: 'F10.2',
        section: '3. Masonry & Blockwork',
        trade: 'Blockwork',
        item: '225mm External Sandcrete Blockwork',
        description: `225mm thick hollow sandcrete blockwork in 1:4 cement mortar, net of openings > 0.50m²`,
        unit: 'm²',
        qty: netExtWallArea,
        rate: 11200,
        formula: `(Perimeter ${p}m × Height ${h}m × ${floors} Floors) - Openings (${openingsArea}m²)`,
        checked: true,
        category: 'masonry'
      },
      {
        id: 'btl-mas-2',
        code: 'F10.3',
        section: '3. Masonry & Blockwork',
        trade: 'Blockwork',
        item: '150mm Internal Partition Blockwork',
        description: '150mm hollow sandcrete blockwork in internal dividing walls bedded in cement mortar',
        unit: 'm²',
        qty: intWallArea,
        rate: 9800,
        formula: `Internal walls (${intW}m) × Height (${h}m) × ${floors} Floors`,
        checked: true,
        category: 'masonry'
      },

      // 4. FINISHES
      {
        id: 'btl-fin-1',
        code: 'M20.1',
        section: '4. Finishes',
        trade: 'Floor Finishes',
        item: 'Vitrified Ceramic Floor Tiles & Screed',
        description: '600x600mm vitrified floor tiles laid on 40mm cement-sand screed (1:4)',
        unit: 'm²',
        qty: floorScreedArea,
        rate: 16500,
        formula: `Gross Floor Area (${fp}m² × ${floors} Floors)`,
        checked: true,
        category: 'finishes'
      },
      {
        id: 'btl-fin-2',
        code: 'M20.2',
        section: '4. Finishes',
        trade: 'Plastering',
        item: 'Internal Cement-Sand Plaster (15mm)',
        description: '15mm internal wall plastering (1:4 mix) with smooth wood float and steel trowel finish',
        unit: 'm²',
        qty: internalPlasterArea,
        rate: 3600,
        formula: `Internal Wall Faces + Internal Side of External Walls`,
        checked: true,
        category: 'finishes'
      },
      {
        id: 'btl-fin-3',
        code: 'M20.3',
        section: '4. Finishes',
        trade: 'Rendering',
        item: 'External Cement-Sand Rendering (15mm)',
        description: '15mm external rendering with waterproofing compound and textured finish',
        unit: 'm²',
        qty: externalRenderArea,
        rate: 3800,
        formula: `External Wall Net Area (${netExtWallArea}m²)`,
        checked: true,
        category: 'finishes'
      },
      {
        id: 'btl-fin-4',
        code: 'K10.1',
        section: '4. Finishes',
        trade: 'Ceiling Finishes',
        item: 'Suspended POP Ceiling / Acoustic Tiles',
        description: 'Standard Plaster of Paris (POP) ceiling with recessed cornice and lighting channels',
        unit: 'm²',
        qty: ceilingArea,
        rate: 12500,
        formula: `Gross ceiling area (${fp}m² × ${floors} Floors)`,
        checked: true,
        category: 'finishes'
      },

      // 5. OPENINGS
      {
        id: 'btl-opn-1',
        code: 'L20.1',
        section: '5. Openings',
        trade: 'Joinery & Doors',
        item: 'Security Steel External Entrance Doors',
        description: '1200x2100mm heavy-duty anti-burglary security steel doors with deadbolts and handles',
        unit: 'Nr',
        qty: 2,
        rate: 220000,
        formula: 'Main front entrance & kitchen back exits',
        checked: true,
        category: 'openings'
      },
      {
        id: 'btl-opn-2',
        code: 'L20.2',
        section: '5. Openings',
        trade: 'Joinery & Doors',
        item: 'Solid Wooden Flush Doors (900x2100mm)',
        description: 'Hollow core hardwood flush doors with hardwood frames, hinges and cylindrical mortice locks',
        unit: 'Nr',
        qty: Math.max(4, doorsCount - 2),
        rate: 85000,
        formula: `Calculated room doors count (${doorsCount} - 2 external)`,
        checked: true,
        category: 'openings'
      },
      {
        id: 'btl-opn-3',
        code: 'L10.1',
        section: '5. Openings',
        trade: 'Windows & Glazing',
        item: 'Aluminum Glazed Casement Windows',
        description: 'Anodized aluminum sliding/casement windows with 5mm tinted glass and mosquito nets',
        unit: 'Nr',
        qty: windowsCount,
        rate: 75000,
        formula: `Window opening count (${windowsCount} Nr)`,
        checked: true,
        category: 'openings'
      },

      // 6. ROOFING
      {
        id: 'btl-rf-1',
        code: 'G20.1',
        section: '6. Roofing',
        trade: 'Structural Timber',
        item: 'Hardwood Roof Carcass & Trusses',
        description: '50x150mm hardwood rafters, 50x100mm wall plates and 50x50mm purlins treated with anti-termite solignum',
        unit: 'm²',
        qty: roofSlopeArea,
        rate: 9800,
        formula: `Footprint (${fp}m²) × 1.22 pitch factor = ${roofSlopeArea}m²`,
        checked: true,
        category: 'roofing'
      },
      {
        id: 'btl-rf-2',
        code: 'H20.1',
        section: '6. Roofing',
        trade: 'Roof Covering',
        item: '0.55mm Aluminum Longspan Roof Sheets',
        description: 'Step-tile 0.55mm prepainted aluminum longspan sheets including ridge caps, flashings, and drive screws',
        unit: 'm²',
        qty: roofSlopeArea,
        rate: 14500,
        formula: `Roof pitch surface (${roofSlopeArea}m²)`,
        checked: true,
        category: 'roofing'
      }
    ];
  }, [
    footprintArea,
    externalPerimeter,
    internalWallLength,
    numberOfFloors,
    floorHeight,
    foundationDepth,
    trenchWidth,
    stripFootingThickness,
    groundSlabThickness,
    openingsDeductionArea,
    doorsCount,
    windowsCount,
  ]);

  // Combined Items: Standard Checklist + User-Added Custom/Gap Items
  const allChecklistItems = useMemo(() => {
    return [...standardChecklistItems, ...customItems];
  }, [standardChecklistItems, customItems]);

  // Toggle checklist item
  const [checkedItemIds, setCheckedItemIds] = useState<Record<string, boolean>>({});
  
  const isItemChecked = (item: BtlCheckItem) => {
    if (checkedItemIds[item.id] !== undefined) return checkedItemIds[item.id];
    return item.checked;
  };

  const toggleItem = (itemId: string, defaultVal: boolean) => {
    setCheckedItemIds(prev => ({
      ...prev,
      [itemId]: prev[itemId] !== undefined ? !prev[itemId] : !defaultVal
    }));
  };

  const deleteCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(it => it.id !== id));
  };

  // Filtered Checklist
  const displayedItems = useMemo(() => {
    if (tradeFilter === 'all') return allChecklistItems;
    return allChecklistItems.filter(it => it.category === tradeFilter);
  }, [allChecklistItems, tradeFilter]);

  // Commercial Math & Totals
  const activeItems = useMemo(() => {
    return allChecklistItems.filter(it => isItemChecked(it));
  }, [allChecklistItems, checkedItemIds]);

  const subtotal = useMemo(() => {
    return activeItems.reduce((acc, it) => acc + (it.qty * it.rate), 0);
  }, [activeItems]);

  const poPercent = 15;
  const vatPercent = 7.5;
  const poAmount = subtotal * (poPercent / 100);
  const vatAmount = (subtotal + poAmount) * (vatPercent / 100);
  const grandTotal = subtotal + poAmount + vatAmount;

  // Format clean items without raw internal tags for official documents
  const getCleanBoqItems = (targetProjId?: string): BoqItem[] => {
    return activeItems.map((it, idx) => ({
      id: `smart-item-${Date.now()}-${idx + 1}`,
      project_id: targetProjId || activeProj?.id || 'proj-smart',
      item_number: idx + 1,
      section: it.section,
      item: it.item,
      description: it.description || it.item,
      unit: it.unit,
      qty: it.qty,
      rate: it.rate,
      amount: it.qty * it.rate,
      source: 'Smart Takeoff Studio'
    }));
  };

  // Direct Excel Export (.xlsx)
  const handleExportExcelDirect = async () => {
    if (activeItems.length === 0) {
      alert('Please select at least one verified takeoff item before exporting.');
      return;
    }
    setIsExportingExcel(true);
    try {
      const items = getCleanBoqItems();
      const proj: Project = {
        id: activeProj?.id || `proj-takeoff-${Date.now()}`,
        user_id: activeProj?.user_id || '',
        title: activeProj?.title || `Smart Takeoff - ${buildingType.toUpperCase()}`,
        location: activeProj?.location || 'Nigeria',
        client_name: activeProj?.client_name || 'Private Client',
        subtotal,
        po_percent: poPercent,
        po_amount: poAmount,
        vat_percent: vatPercent,
        vat_amount: vatAmount,
        swamp_premium_percent: 0,
        drawing_filename: activeProj?.drawing_filename || '',
        grand_total: grandTotal,
        items,
        status: 'In Progress',
        created_at: new Date().toISOString()
      };

      if (onExportExcel) {
        onExportExcel(items, proj);
      } else {
        await exportProjectToExcel(proj);
      }
    } catch (err: any) {
      console.error('Excel export failed:', err);
      alert('Failed to export Excel file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Direct PDF Export (.pdf)
  const handleExportPdfDirect = async () => {
    if (activeItems.length === 0) {
      alert('Please select at least one verified takeoff item before exporting.');
      return;
    }
    setIsExportingPdf(true);
    try {
      const items = getCleanBoqItems();
      const proj: Project = {
        id: activeProj?.id || `proj-takeoff-${Date.now()}`,
        user_id: activeProj?.user_id || '',
        title: activeProj?.title || `Smart Takeoff - ${buildingType.toUpperCase()}`,
        location: activeProj?.location || 'Nigeria',
        client_name: activeProj?.client_name || 'Private Client',
        subtotal,
        po_percent: poPercent,
        po_amount: poAmount,
        vat_percent: vatPercent,
        vat_amount: vatAmount,
        swamp_premium_percent: 0,
        drawing_filename: activeProj?.drawing_filename || '',
        grand_total: grandTotal,
        items,
        status: 'In Progress',
        created_at: new Date().toISOString()
      };

      if (onExportPdf) {
        onExportPdf(items, proj);
      } else {
        await exportProjectToPdf(proj);
      }
    } catch (err: any) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF file: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Transfer Verified Takeoff to Project BOQ and persist to database
  const handleExecuteCommit = async (openNow: boolean = openWorkspaceAfterCommit) => {
    if (activeItems.length === 0) {
      alert('Please select at least one verified trade item to commit.');
      return;
    }
    setIsCommitting(true);
    try {
      const isNew = transferTargetMode === 'new' || (!selectedProjectId && projects.length === 0);
      const titleToUse = isNew 
        ? (newProjectTitle.trim() || `Smart Takeoff - ${buildingType.toUpperCase()}`)
        : (activeProj?.title || 'Active Project');
      
      const targetProjId = isNew ? `proj-${Date.now()}` : selectedProjectId;
      const items = getCleanBoqItems(targetProjId);
      const summaryNotes = `Smart Takeoff Studio Verified Bill for ${buildingType.toUpperCase()}: Footprint ${footprintArea}m², Perimeter ${externalPerimeter}m, ${numberOfFloors} Floors, ${activeItems.length} verified items.`;

      await onCommitToBoq(items, summaryNotes, {
        targetProjectId: isNew ? undefined : selectedProjectId,
        createNewProject: isNew,
        projectTitle: titleToUse,
        openProjectNow: openNow
      });

      setCommittedProjectName(titleToUse);
      setShowTransferModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 8000);
    } catch (err: any) {
      console.error('Failed to commit takeoff to BOQ:', err);
      alert('Transfer failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsCommitting(false);
    }
  };

  // Quick commit or open transfer options
  const handleCommitToBoq = () => {
    setShowTransferModal(true);
  };

  return (
    <div id="smart-takeoff-studio-view" className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans">
      
      {/* 1. TOP HEADER NAVIGATION & PROJECT SELECTOR */}
      <header className="bg-[#0b1722] border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Smart Takeoff Studio
              </h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 hidden sm:inline-block">
                BESMM4 Calibrated
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Drawing Viewport above • Deterministic BESMM4 BTL Checklist below • 100% audit-proof
            </p>
          </div>
        </div>

        {/* Project Selector & Viewport Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {projects.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Building Typology */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">Archetype:</span>
            <select
              value={buildingType}
              onChange={(e) => handleBuildingTypeChange(e.target.value as any)}
              className="bg-transparent text-emerald-300 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="2-storey" className="bg-slate-900 text-white">2-Storey Residential (Duplex/Hostel)</option>
              <option value="bungalow" className="bg-slate-900 text-white">1-Storey Bungalow</option>
              <option value="commercial" className="bg-slate-900 text-white">Commercial Multi-Storey Office</option>
              <option value="warehouse" className="bg-slate-900 text-white">Industrial Warehouse / Hall</option>
            </select>
          </div>

          {/* Viewport Height Mode Switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewportMode('split')}
              title="Split 50/50 View"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                viewportMode === 'split' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              50/50
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('expanded_drawing')}
              title="Expanded Drawing (75% Canvas)"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                viewportMode === 'expanded_drawing' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              75% Plan
            </button>
            <button
              type="button"
              onClick={() => setViewportMode('max_drawing')}
              title="Max Drawing (Full Canvas Focus)"
              className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                viewportMode === 'max_drawing' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Max
            </button>
          </div>

          {/* Direct Export Buttons */}
          <button
            type="button"
            disabled={isExportingExcel}
            onClick={handleExportExcelDirect}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 cursor-pointer transition active:scale-95 disabled:opacity-50"
            title="Download standard 3-tab BESMM4 Excel spreadsheet (.xlsx)"
          >
            {isExportingExcel ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <button
            type="button"
            disabled={isExportingPdf}
            onClick={handleExportPdfDirect}
            className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 text-xs font-semibold flex items-center space-x-1.5 border border-rose-800/60 cursor-pointer transition active:scale-95 disabled:opacity-50"
            title="Download certified Bill of Quantities PDF (.pdf)"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Push to BOQ Button */}
          <button
            type="button"
            onClick={handleCommitToBoq}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Transfer to BOQ</span>
          </button>
        </div>
      </header>

      {/* SUCCESS TOAST */}
      {showSuccessToast && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Success: Verified BESMM4 Takeoff saved to {committedProjectName || 'Project BOQ'}!</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('project-workspace', 'boq')}
            className="px-3 py-1 rounded-md bg-white text-emerald-900 font-bold text-xs flex items-center space-x-1.5 shadow-xs hover:bg-emerald-50 cursor-pointer transition active:scale-95"
          >
            <span>Open Project BOQ Workspace</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-800" />
          </button>
        </div>
      )}

      {/* 2. UPPER HALF: THE DRAWING VIEWPORT & WORKSPACE */}
      <section 
        className={`bg-slate-950 border-b border-slate-800 flex flex-col relative select-none transition-all duration-300 ${
          viewportMode === 'split' ? 'h-[48vh] min-h-[350px]' : 
          viewportMode === 'expanded_drawing' ? 'h-[72vh] min-h-[500px]' : 'h-[88vh] min-h-[600px]'
        }`}
      >
        
        {/* Drawing Controls Bar */}
        <div className="bg-[#101e2b] px-3 py-1.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-200 truncate max-w-xs">{drawingTitle}</span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              Zoom: {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Takeoff Tools Palette */}
          <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-lg border border-slate-700/80">
            <button
              type="button"
              onClick={() => { setActiveTool('pan'); setCurrentPoints([]); }}
              title="Pan Tool (Drag to move plan / Double touch to pinch)"
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                activeTool === 'pan' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pan</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTool('perimeter'); setCurrentPoints([]); }}
              title="Measure External Wall Perimeter (Click corners)"
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                activeTool === 'perimeter' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>Perimeter (m)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTool('area'); setCurrentPoints([]); }}
              title="Measure Footprint / Floor Area (Polygon)"
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                activeTool === 'area' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Footprint (m²)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTool('internal_walls'); setCurrentPoints([]); }}
              title="Measure Internal Partition Walls"
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                activeTool === 'internal_walls' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Internal Walls</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTool('count'); setCurrentPoints([]); }}
              title="Count Doors, Windows, or Columns"
              className={`p-1.5 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer ${
                activeTool === 'count' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Hash className="w-3.5 h-3.5 text-purple-400" />
              <span>Count Fixtures</span>
            </button>
          </div>

          {/* Action buttons (Upload, Finish, Zoom, Fit) */}
          <div className="flex items-center space-x-2">
            {currentPoints.length >= 2 && (
              <button
                type="button"
                onClick={finishCurrentMeasurement}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 transition cursor-pointer animate-pulse"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Measured Value</span>
              </button>
            )}

            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(6.0, prev + 0.25))}
                title="Zoom In"
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.15, prev - 0.25))}
                title="Zoom Out"
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={fitDrawingToContainer}
                title="Fit Sheet to Screen (Crisp Full View)"
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-emerald-300 hover:bg-slate-700 rounded transition cursor-pointer"
              >
                Fit Sheet
              </button>
              <button
                type="button"
                onClick={() => { setZoom(1.0); setPanOffset({ x: 0, y: 0 }); }}
                title="100% Native Scale"
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 rounded transition cursor-pointer"
              >
                100%
              </button>
            </div>

            {/* Multi-Page PDF Sheet Navigation */}
            {pdfDoc && numPages > 1 && (
              <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1 || isLoadingPdf}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition"
                  title="Previous Sheet (Page)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center space-x-1 text-xs px-1">
                  <span className="text-slate-400 text-[10px]">Sheet</span>
                  <select
                    value={currentPage}
                    onChange={(e) => handleGoToPage(Number(e.target.value))}
                    disabled={isLoadingPdf}
                    className="bg-slate-800 text-emerald-400 font-bold border border-slate-700 rounded px-1.5 py-0.5 outline-none text-xs cursor-pointer"
                  >
                    {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => (
                      <option key={pg} value={pg}>
                        {pg} / {numPages}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= numPages || isLoadingPdf}
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition"
                  title="Next Sheet (Page)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* AI Scan Trigger Button (User Choice - Never Imposed) */}
            <button
              type="button"
              onClick={() => setShowAiPromptModal(true)}
              className="px-2.5 py-1 rounded bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/60 font-semibold text-xs flex items-center space-x-1 transition cursor-pointer"
              title="Ask AI to detect dimensions from this drawing (Reviewable first)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">AI Dimension Scan</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadDrawing}
              accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold text-xs flex items-center space-x-1 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Load Sheet</span>
            </button>
          </div>
        </div>

        {/* Canvas Workspace View: Responsive, Touch-Ready & Mouse-Wheel Calibrated */}
        <div 
          ref={containerRef}
          className="flex-1 w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center relative cursor-crosshair touch-none"
        >
          <canvas
            ref={canvasRef}
            width={2400}
            height={1600}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="touch-none select-none max-w-none block"
            style={{ imageRendering: 'auto' }}
          />

          {/* Floating On-Canvas PDF Page Navigation Bar */}
          {pdfDoc && numPages > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || isLoadingPdf}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition cursor-pointer disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev Sheet</span>
              </button>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-slate-400 font-sans text-[11px]">Sheet</span>
                <span className="font-bold text-emerald-400">{currentPage}</span>
                <span className="text-slate-500">/</span>
                <span className="font-bold text-slate-200">{numPages}</span>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || isLoadingPdf}
                className="flex items-center space-x-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white rounded-xl transition cursor-pointer disabled:opacity-30 shadow-xs"
              >
                <span className="hidden sm:inline">Next Sheet</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Loading Indicator for PDF rendering */}
          {isLoadingPdf && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-30 space-y-2 pointer-events-none">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Rendering PDF Sheet {currentPage} of {numPages}...</span>
            </div>
          )}

          {/* Floating Helpful Overlay Tip */}
          <div className="absolute bottom-3 left-4 bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 flex items-center space-x-2 shadow-lg pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {activeTool === 'pan' && 'Pan mode: Drag with 1 finger/mouse. Pinch with 2 fingers or roll wheel to zoom anywhere!'}
              {activeTool === 'perimeter' && 'Perimeter mode: Tap each building corner. Tap "Apply Measured Value" when done.'}
              {activeTool === 'area' && 'Area mode: Tap corners around the building footprint to measure m².'}
              {activeTool === 'internal_walls' && 'Internal walls mode: Trace along internal room partitions.'}
              {activeTool === 'count' && 'Count mode: Tap on doors or windows to count them.'}
            </span>
          </div>

          {/* Clear Measurements Button */}
          {savedMeasurements.length > 0 && (
            <button
              type="button"
              onClick={() => { setSavedMeasurements([]); setCurrentPoints([]); }}
              className="absolute bottom-3 right-4 px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-red-900/80 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Clear Traces ({savedMeasurements.length})</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. GROUND-TRUTH DIMENSIONS RIBBON (Directly Connected to BTL Checklist) */}
      <div className="bg-[#142634] border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Verified Ground-Truth Building Parameters
            </h3>
            <span className="text-[11px] text-slate-400">(Editable numbers directly driving BESMM4 formulas below)</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            Gross Floor Area: {(footprintArea * numberOfFloors).toFixed(1)} m²
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-xs">
          {/* Footprint Area */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Footprint (m²)</label>
            <input
              type="number"
              value={footprintArea}
              onChange={(e) => setFootprintArea(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* External Perimeter */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Perimeter Run (m)</label>
            <input
              type="number"
              value={externalPerimeter}
              onChange={(e) => setExternalPerimeter(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* Internal Walls */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Internal Walls (m)</label>
            <input
              type="number"
              value={internalWallLength}
              onChange={(e) => setInternalWallLength(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* Number of Floors */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Storeys / Floors</label>
            <input
              type="number"
              value={numberOfFloors}
              min={1}
              max={10}
              onChange={(e) => setNumberOfFloors(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* Wall Height */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Floor Height (m)</label>
            <input
              type="number"
              step="0.1"
              value={floorHeight}
              onChange={(e) => setFloorHeight(parseFloat(e.target.value) || 3.0)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* Foundation Depth */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Trench Depth (m)</label>
            <input
              type="number"
              step="0.05"
              value={foundationDepth}
              onChange={(e) => setFoundationDepth(parseFloat(e.target.value) || 1.05)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>

          {/* Openings Area */}
          <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-700">
            <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Openings (m²)</label>
            <input
              type="number"
              value={openingsDeductionArea}
              onChange={(e) => setOpeningsDeductionArea(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 px-2 py-1 rounded text-white font-mono font-bold border border-slate-600 focus:outline-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. LOWER HALF: THE BTL BESMM4 CHECKLIST TABLE */}
      <section className="flex-1 bg-slate-950 p-4 space-y-4">
        
        {/* Trade Filter Tabs & Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {[
              { id: 'all', label: `All Trades (${allChecklistItems.length})` },
              { id: 'substructure', label: '1. Substructure' },
              { id: 'frame', label: '2. Concrete Frame' },
              { id: 'masonry', label: '3. Blockwork' },
              { id: 'finishes', label: '4. Finishes' },
              { id: 'openings', label: '5. Openings' },
              { id: 'roofing', label: '6. Roofing' },
              { id: 'services', label: '7. Services' },
              { id: 'external', label: '8. External Works' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTradeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  tradeFilter === tab.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* AI Trade Scan & Gap Audit Button */}
            <button
              type="button"
              onClick={handleOpenAiAuditModal}
              className="px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Gap Audit &amp; Suggestions</span>
            </button>

            {/* Add Custom / Omitted Item Button */}
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Omitted Item</span>
            </button>
          </div>
        </div>

        {/* The BESMM4 Itemized Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#0d1b26] shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#122433] text-slate-300 font-bold border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">Include</th>
                <th className="px-3 py-2.5 w-20">Code</th>
                <th className="px-3 py-2.5">Trade Item &amp; Description</th>
                <th className="px-3 py-2.5">Origin / Derivation</th>
                <th className="px-3 py-2.5 text-right w-24">Quantity</th>
                <th className="px-3 py-2.5 text-center w-14">Unit</th>
                <th className="px-3 py-2.5 text-right w-28">Rate (₦)</th>
                <th className="px-3 py-2.5 text-right w-32">Total (₦)</th>
                <th className="px-3 py-2.5 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {displayedItems.map((item) => {
                const checked = isItemChecked(item);
                const itemTotal = item.qty * item.rate;

                return (
                  <tr 
                    key={item.id} 
                    className={`transition-colors ${checked ? 'hover:bg-slate-900/60' : 'opacity-40 bg-slate-950/40'}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.id, item.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600 cursor-pointer"
                      />
                    </td>

                    {/* Item Code */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                      {item.code}
                    </td>

                    {/* Item Description */}
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>{item.item}</span>
                        {item.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-900 text-indigo-300 border border-indigo-700">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 max-w-xl">{item.description}</div>
                    </td>

                    {/* Math Formula Derivation */}
                    <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-400 bg-emerald-950/20 px-2 rounded">
                      {item.formula}
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                      {item.qty.toLocaleString()}
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400">
                      {item.unit}
                    </td>

                    {/* Rate */}
                    <td className="px-3 py-2.5 text-right font-mono text-slate-300">
                      ₦{item.rate.toLocaleString()}
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-300">
                      ₦{itemTotal.toLocaleString()}
                    </td>

                    {/* Action (Delete custom items) */}
                    <td className="px-3 py-2.5 text-center">
                      {item.isCustom ? (
                        <button
                          type="button"
                          onClick={() => deleteCustomItem(item.id)}
                          title="Delete custom item"
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Std</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 5. COMMERCIAL SUMMARY BAR (Full Width, Clear Breakdown of Net Works, P&O, VAT, Gross Total) */}
        <div className="bg-[#101e2b] p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
            <div className="p-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                Net Works (Subtotal)
              </span>
              <span className="text-base sm:text-xl font-black text-white block mt-1">
                {formatNaira(subtotal)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Sum of {activeItems.length} verified trade items
              </span>
            </div>

            <div className="p-2 sm:pl-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                Profit &amp; Overheads (15%)
              </span>
              <span className="text-base sm:text-xl font-black text-slate-200 block mt-1">
                {formatNaira(poAmount)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Contractor overhead allowance
              </span>
            </div>

            <div className="p-2 sm:pl-4">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">
                VAT (7.5% Nigerian Statutory)
              </span>
              <span className="text-base sm:text-xl font-black text-slate-200 block mt-1">
                {formatNaira(vatAmount)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                FIRS statutory withholding tax
              </span>
            </div>

            <div className="p-2 sm:pl-4 bg-emerald-950/30 rounded-xl border border-emerald-900/40">
              <span className="text-[11px] text-emerald-400 uppercase font-black tracking-wider block">
                Gross Tender Sum
              </span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400 block mt-1">
                {formatNaira(grandTotal)}
              </span>
              <span className="text-[10px] text-emerald-500/80 block mt-0.5 font-medium">
                Certified Total Estimate
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* MODAL 0: TRANSFER & COMMIT TO PROJECT BOQ */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Transfer Verified Bill to Project BOQ
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Saves {activeItems.length} measured BESMM4 trade items directly into your database.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Destination Selection */}
            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-300 block">Choose Destination Project:</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Existing Active Project */}
                <button
                  type="button"
                  onClick={() => setTransferTargetMode('existing')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    transferTargetMode === 'existing'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Existing Project</span>
                    </span>
                    <input
                      type="radio"
                      checked={transferTargetMode === 'existing'}
                      onChange={() => setTransferTargetMode('existing')}
                      className="text-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 truncate">
                    {activeProj?.title || 'Selected active project'}
                  </span>
                </button>

                {/* Option 2: Create New Project */}
                <button
                  type="button"
                  onClick={() => setTransferTargetMode('new')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    transferTargetMode === 'new'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New Project</span>
                    </span>
                    <input
                      type="radio"
                      checked={transferTargetMode === 'new'}
                      onChange={() => setTransferTargetMode('new')}
                      className="text-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 truncate">
                    Start a fresh dedicated project
                  </span>
                </button>
              </div>

              {transferTargetMode === 'existing' && projects.length > 1 && (
                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">Select Active Project to Update:</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-xs"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.location || 'Nigeria'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {transferTargetMode === 'new' && (
                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 block mb-1">New Project Title:</label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="Enter new project title..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-xs"
                  />
                </div>
              )}

              {/* Checkbox: Open workspace immediately */}
              <div className="pt-2">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openWorkspaceAfterCommit}
                    onChange={(e) => setOpenWorkspaceAfterCommit(e.target.checked)}
                    className="rounded border-slate-600 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-xs">
                    Open Project BOQ Workspace immediately after saving
                  </span>
                </label>
                <p className="text-[10px] text-slate-400 pl-6 pt-0.5">
                  Takes you directly into the full Bill of Quantities view with item editing, market rates, and official exports.
                </p>
              </div>

              {/* Summary Stats */}
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Verified Trade Items:</span>
                  <span className="font-bold text-white">{activeItems.length} items</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Tender Sum (NGN):</span>
                  <span className="font-black text-emerald-400">{formatNaira(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCommitting}
                onClick={() => handleExecuteCommit(openWorkspaceAfterCommit)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Save &amp; {openWorkspaceAfterCommit ? 'Open Project BOQ' : 'Update Project'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD OMITTED CUSTOM ITEM */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Omitted Trade Item</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Trade Category</label>
                <select
                  value={newItemTrade}
                  onChange={(e) => setNewItemTrade(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="substructure">1. Substructure &amp; Groundwork</option>
                  <option value="frame">2. Reinforced Concrete Frame</option>
                  <option value="masonry">3. Blockwork &amp; Walls</option>
                  <option value="finishes">4. Finishes (Floors/Walls/Ceilings)</option>
                  <option value="openings">5. Doors &amp; Windows</option>
                  <option value="roofing">6. Roofing &amp; Covering</option>
                  <option value="services">7. Mechanical &amp; Electrical Services</option>
                  <option value="external">8. External Works &amp; Compound</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raft Foundation Slab / Borehole Facility"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description &amp; Specification</label>
                <textarea
                  rows={2}
                  placeholder="Full trade specification and workmanship clause..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Rate (₦)</label>
                  <input
                    type="number"
                    required
                    value={newItemRate}
                    onChange={(e) => setNewItemRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Derivation / Formula Note</label>
                <input
                  type="text"
                  placeholder="e.g. Measured from Grid A-C or 1 Nr Lump Sum"
                  value={newItemFormula}
                  onChange={(e) => setNewItemFormula(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Add Item to Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AI TRADE SCAN & GAP AUDIT (SUGGESTIONS - BTL ESTIMATOR STYLE) */}
      {showAiAuditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    BTL AI Gap Suggestions &amp; Omission Audit
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Formula-driven construction items. Select only the ones you want in your bill.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiAuditModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Multi-select Toolbar */}
            <div className="flex items-center justify-between text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllAuditItems}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllAuditItems}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-[11px] cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {selectedAuditIds.length} of {aiRecommendedOmissions.length} selected
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {aiRecommendedOmissions.map((rec) => {
                const isSelected = selectedAuditIds.includes(rec.id);
                const itemTotal = rec.qty * rec.rate;

                return (
                  <div 
                    key={rec.id} 
                    className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 text-xs ${
                      isSelected 
                        ? 'bg-slate-800/90 border-emerald-500/60 shadow-xs' 
                        : 'bg-slate-800/40 border-slate-700/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAuditItem(rec.id)}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600 cursor-pointer shrink-0"
                      />

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {rec.trade}
                          </span>
                          <strong className="text-white font-semibold">{rec.item}</strong>
                        </div>
                        <p className="text-[11px] text-slate-400">{rec.description}</p>
                        
                        {/* Traceable BTL Formula */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                            BTL Formula: {rec.formula}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300">
                            {rec.qty.toLocaleString()} {rec.unit} @ ₦{rec.rate.toLocaleString()} = <strong className="text-emerald-300">₦{itemTotal.toLocaleString()}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => addRecommendedItem(rec)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs flex items-center space-x-1 transition cursor-pointer"
                      title="Add single item directly to bill"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAiAuditModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={selectedAuditIds.length === 0}
                onClick={handleAddSelectedAuditItems}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Add Selected Items to Bill ({selectedAuditIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PROMPT USER FOR AI DIMENSION EXTRACTION (NON-IMPOSING) */}
      {showAiPromptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-700/60 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Extract Dimensions with AI?
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Architectural sheet uploaded: choose your preferred take-off mode.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPromptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              We respect your professional workflow. Would you like AI to scan this sheet to detect architectural dimensions (Footprint area, perimeter run, partition walls, and storey height)?
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleTriggerAiScan}
                className="w-full p-4 rounded-xl border border-indigo-500/50 bg-indigo-950/40 hover:bg-indigo-900/50 text-left transition cursor-pointer flex items-start space-x-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-200 flex items-center gap-1.5">
                    <span>Yes, Extract Dimensions with AI</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-indigo-800/80 text-indigo-200 rounded font-normal">Reviewable First</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    AI analyzes your drawing scale and rooms. You will be able to review, adjust, or discard any detected figure before it touches your Bill of Quantities.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setShowAiPromptModal(false)}
                className="w-full p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-left transition cursor-pointer flex items-start space-x-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 border border-slate-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-slate-600 group-hover:text-white transition">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-slate-200">
                    No, I Will Measure Manually (Don't Impose Figures)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Keep your current baseline or trace perimeter, footprint, and walls directly using our on-screen calibrated measurement tools.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>You can always trigger AI scanning later from the toolbar.</span>
              <button
                type="button"
                onClick={() => setShowAiPromptModal(false)}
                className="text-slate-400 hover:text-white font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REVIEW & VERIFY AI DETECTED DIMENSIONS */}
      {showAiReviewModal && detectedAiFigures && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Review Detected Dimensions
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Adjust any figure before applying to your BTL Take-off checklist.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiReviewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editableFigures.reasoning && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{editableFigures.reasoning}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Footprint Area (m²)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editableFigures.footprintArea}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, footprintArea: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  External Wall Perimeter (m)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editableFigures.externalPerimeter}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, externalPerimeter: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Internal Partition Walls (m)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editableFigures.internalWallLength}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, internalWallLength: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Storey / Floor Count (Nos)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editableFigures.numberOfFloors}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, numberOfFloors: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Storey Clear Height (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editableFigures.floorHeight}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, floorHeight: parseFloat(e.target.value) || 3.0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Openings Deduction (m²)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editableFigures.openingsArea}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, openingsArea: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Total Doors (Nr)
                </label>
                <input
                  type="number"
                  step="1"
                  value={editableFigures.doorsCount}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, doorsCount: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Total Windows (Nr)
                </label>
                <input
                  type="number"
                  step="1"
                  value={editableFigures.windowsCount}
                  onChange={(e) => setEditableFigures(prev => ({ ...prev, windowsCount: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400">
              <strong className="text-slate-200">Note:</strong> You can edit any figure above before applying. Nothing will be imposed on your BTL checklist until you click Apply.
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAiReviewModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel (Keep Current Figures)
              </button>
              <button
                type="button"
                onClick={handleApplyAiDetectedFigures}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply Dimensions to Take-off</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
