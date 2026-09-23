/**
 * Let's Estimate - Real Architectural Drawing Viewer & Manual Takeoff Engine
 * Renders real uploaded drawings (PDF / JPG / PNG / WEBP) on an interactive HTML5 Canvas.
 * Supports zoom, pan, PDF page navigation, fit-to-screen, scale calibration,
 * and direct manual takeoff (length, area, wall length, count, annotations).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Ruler,
  Square,
  Hash,
  Box,
  MessageSquare,
  Check,
  CheckCircle2,
  Trash2,
  Edit2,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Search,
  Upload,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  RotateCcw,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
  BookOpen,
  Compass,
  Crosshair,
  Move
} from 'lucide-react';
import { Project, ManualMeasurement, BoqItem, DrawingSheet } from '../../types';
import { formatNaira } from '../../utils/format';
import { safeStorage } from '../../utils/storage';
import { generateSampleArchitecturalPlan } from './sampleBlueprint';

// Configure local PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export type TakeoffTool = 'pan' | 'calibrate' | 'length' | 'area' | 'wall' | 'count' | 'annotation';

interface RealDrawingViewerProps {
  project: Project;
  initialFileUrl?: string;
  initialFileName?: string;
  onAddBoqItem: (item: Partial<BoqItem>) => void;
  onUpdateProjectMeasurements?: (measurements: ManualMeasurement[]) => void;
  onDrawingUploaded?: (drawing: DrawingSheet) => void;
  highlightMeasurementId?: string | null;
  highlightEvidence?: { sheetRef?: string; locationRef?: string; formula?: string } | null;
  onSwitchToAiTakeoff?: (file: File) => void;
}

export const RealDrawingViewer: React.FC<RealDrawingViewerProps> = ({
  project,
  initialFileUrl,
  initialFileName,
  onAddBoqItem,
  onUpdateProjectMeasurements,
  onDrawingUploaded,
  highlightMeasurementId,
  highlightEvidence,
  onSwitchToAiTakeoff,
}) => {
  // Drawing source state
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>(() => {
    return initialFileUrl || project.drawing_url || (project.drawings && project.drawings.length > 0 ? project.drawings[0].fileUrl : '');
  });
  const [fileName, setFileName] = useState<string>(() => {
    return initialFileName || project.drawing_filename || (project.drawings && project.drawings.length > 0 ? project.drawings[0].fileName : '');
  });

  // PDF navigation state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [jumpInput, setJumpInput] = useState<string>('1');
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSampleDrawing, setIsSampleDrawing] = useState<boolean>(false);
  const [renderVersion, setRenderVersion] = useState<number>(0);
  const [showAllPagesMeasurements, setShowAllPagesMeasurements] = useState<boolean>(false);
  const [pageSearchQuery, setPageSearchQuery] = useState<string>('');

  const currentRenderTaskRef = useRef<any>(null);
  const pageCacheRef = useRef<Map<number, { canvas: HTMLCanvasElement; width: number; height: number }>>(new Map());

  // Rendered Image Cache (offscreen canvas holding the real drawing image/page)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawingDimensions, setDrawingDimensions] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });

  // Viewport transforms
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  // Active Tool
  const [activeTool, setActiveTool] = useState<TakeoffTool>('pan');

  // Scale calibration state
  const [scaleRatio, setScaleRatio] = useState<number>(100); // 1:100 default
  const [pixelsPerMeter, setPixelsPerMeter] = useState<number>(37.79); // Default ~96dpi / 2.54cm * 1m/100
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);
  const [tempCalibrationDistancePx, setTempCalibrationDistancePx] = useState<number>(0);
  const [inputRealMeters, setInputRealMeters] = useState<string>('4.5');

  // Interactive drawing states
  const [currentPoints, setCurrentPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  // Wall measurement popup
  const [showWallConfig, setShowWallConfig] = useState<boolean>(false);
  const [wallHeight, setWallHeight] = useState<number>(3.0);
  const [wallThicknessMm, setWallThicknessMm] = useState<number>(225);
  const [wallDeductionsM2, setWallDeductionsM2] = useState<number>(0);

  // Annotations
  const [showAnnotationModal, setShowAnnotationModal] = useState<boolean>(false);
  const [annotationText, setAnnotationText] = useState<string>('');
  const [annotationPendingCoord, setAnnotationPendingCoord] = useState<{ x: number; y: number } | null>(null);

  // Saved Measurements
  const [measurements, setMeasurements] = useState<ManualMeasurement[]>(() => {
    return project.manual_measurements || project.takeoff?.measurements || [];
  });
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(highlightMeasurementId || null);
  const [editingMeasurement, setEditingMeasurement] = useState<ManualMeasurement | null>(null);

  // Side panel tab: 'measurements' | 'sheets' | 'details'
  const [sidebarTab, setSidebarTab] = useState<'measurements' | 'sheets'>('measurements');

  // Measurements section visibility & adjustable width
  const [isMeasurementsVisible, setIsMeasurementsVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeStorage.getItem('takeoff_measurements_visible');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeStorage.getItem('takeoff_measurements_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 520) return parsed;
      }
    }
    return 260; // Sleek default so it does not block half the drawing space
  });

  const [isResizingPanel, setIsResizingPanel] = useState<boolean>(false);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartWidthRef = useRef<number>(260);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Navigation & Zoom Enhancements
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [wheelScrollMode, setWheelScrollMode] = useState<'zoom' | 'pan'>('zoom');
  const [showZoomPresetsMenu, setShowZoomPresetsMenu] = useState<boolean>(false);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-observe canvas container size changes for perfect viewport synchronization
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerDimensions({
            width: Math.round(entry.contentRect.width),
            height: Math.round(entry.contentRect.height),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Minimap dimensions & coordinate mapping
  const minimapWidth = 170;
  const minimapAspect =
    drawingDimensions.width && drawingDimensions.height
      ? drawingDimensions.height / drawingDimensions.width
      : 0.65;
  const minimapHeight = Math.max(75, Math.min(130, Math.round(minimapWidth * minimapAspect)));
  const minimapScaleX = minimapWidth / Math.max(1, drawingDimensions.width);
  const minimapScaleY = minimapHeight / Math.max(1, drawingDimensions.height);

  const containerW = containerDimensions.width || 800;
  const containerH = containerDimensions.height || 600;

  const visibleLeftInDrawing = -pan.x / zoom;
  const visibleTopInDrawing = -pan.y / zoom;
  const visibleWidthInDrawing = containerW / zoom;
  const visibleHeightInDrawing = containerH / zoom;

  const minimapViewportLeft = Math.max(0, Math.min(minimapWidth, Math.round(visibleLeftInDrawing * minimapScaleX)));
  const minimapViewportTop = Math.max(0, Math.min(minimapHeight, Math.round(visibleTopInDrawing * minimapScaleY)));
  const minimapViewportWidth = Math.max(10, Math.min(minimapWidth - minimapViewportLeft, Math.round(visibleWidthInDrawing * minimapScaleX)));
  const minimapViewportHeight = Math.max(10, Math.min(minimapHeight - minimapViewportTop, Math.round(visibleHeightInDrawing * minimapScaleY)));

  // Render thumbnail onto minimap canvas
  useEffect(() => {
    if (!showMinimap || !minimapCanvasRef.current || !offscreenCanvasRef.current) return;
    const miniCtx = minimapCanvasRef.current.getContext('2d');
    if (!miniCtx) return;

    miniCtx.clearRect(0, 0, minimapWidth, minimapHeight);
    miniCtx.fillStyle = '#020617';
    miniCtx.fillRect(0, 0, minimapWidth, minimapHeight);

    try {
      miniCtx.drawImage(
        offscreenCanvasRef.current,
        0,
        0,
        offscreenCanvasRef.current.width,
        offscreenCanvasRef.current.height,
        0,
        0,
        minimapWidth,
        minimapHeight
      );
    } catch {
      // ignore
    }
  }, [showMinimap, renderVersion, minimapWidth, minimapHeight]);

  // Handle measurement panel dragging
  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingPanel(true);
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = panelWidth;
  };

  useEffect(() => {
    if (!isResizingPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = resizeStartXRef.current - e.clientX;
      const newWidth = Math.min(Math.max(resizeStartWidthRef.current + deltaX, 180), 520);
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingPanel(false);
      safeStorage.setItem('takeoff_measurements_width', panelWidth.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingPanel, panelWidth]);

  const toggleMeasurementsVisibility = () => {
    setIsMeasurementsVisible((prev) => {
      const next = !prev;
      safeStorage.setItem('takeoff_measurements_visible', String(next));
      return next;
    });
  };

  // Synchronize initial prop changes
  useEffect(() => {
    if (initialFileUrl && initialFileUrl !== fileUrl) {
      setFileUrl(initialFileUrl);
    }
  }, [initialFileUrl]);

  useEffect(() => {
    if (initialFileName && initialFileName !== fileName) {
      setFileName(initialFileName);
    }
  }, [initialFileName]);

  // Auto-fit given drawing dimensions into canvas viewport
  const autoFitDrawing = useCallback((dw: number, dh: number) => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth || 800;
      const containerHeight = containerRef.current.clientHeight || 600;
      const scaleW = (containerWidth - 40) / dw;
      const scaleH = (containerHeight - 40) / dh;
      const initialZoom = Math.min(scaleW, scaleH, 1);
      setZoom(Math.max(0.2, initialZoom));
      setPan({
        x: Math.round((containerWidth - dw * initialZoom) / 2),
        y: Math.round((containerHeight - dh * initialZoom) / 2),
      });
    }
  }, []);

  // Load calibrated sample architectural blueprint as resilient fallback
  const loadSampleArchitecturalDrawing = useCallback(() => {
    const sample = generateSampleArchitecturalPlan();
    offscreenCanvasRef.current = sample.canvas;
    setDrawingDimensions({ width: sample.width, height: sample.height });
    setIsPdf(false);
    setPdfDoc(null);
    setNumPages(1);
    setCurrentPage(1);
    setJumpInput('1');
    setIsSampleDrawing(true);
    setLoadError(null);
    setIsLoadingFile(false);
    setScaleRatio(sample.scaleRatio);
    setPixelsPerMeter(sample.pixelsPerMeter);
    setIsCalibrated(true);
    setRenderVersion((v) => v + 1);
    autoFitDrawing(sample.width, sample.height);
  }, [autoFitDrawing]);

  // Helper to reliably check if a source represents a PDF document
  const checkIsPdfSource = useCallback(
    async (source: string | ArrayBuffer, hintName?: string): Promise<boolean> => {
      if (hintName && hintName.toLowerCase().endsWith('.pdf')) return true;
      if (typeof source === 'string') {
        if (source.toLowerCase().includes('.pdf') || source.includes('application/pdf')) return true;
        if (source.startsWith('data:application/pdf')) return true;
        if (source.startsWith('blob:')) {
          if (activeFile && (activeFile.type === 'application/pdf' || activeFile.name.toLowerCase().endsWith('.pdf'))) {
            return true;
          }
          try {
            const res = await fetch(source);
            const blob = await res.blob();
            if (blob.type === 'application/pdf') return true;
            const headBuf = await blob.slice(0, 5).arrayBuffer();
            const head = new Uint8Array(headBuf);
            if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) {
              return true; // %PDF
            }
          } catch {
            // Ignore fetch error on blob
          }
        }
      } else if (source instanceof ArrayBuffer) {
        const head = new Uint8Array(source.slice(0, 5));
        if (head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46) {
          return true; // %PDF
        }
      }
      return false;
    },
    [activeFile]
  );

  // Helper to load image with fallback for CORS and local URLs
  const loadImageSafe = (imgSrc: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Only set crossOrigin if not blob: or data: URL to avoid security errors
      if (!imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        // If crossOrigin anonymous failed (e.g. server lacks CORS headers), retry without crossOrigin
        if (img.crossOrigin) {
          const retryImg = new Image();
          retryImg.onload = () => resolve(retryImg);
          retryImg.onerror = () => reject(new Error('Image could not be rendered'));
          retryImg.src = imgSrc;
        } else {
          reject(new Error('Image could not be rendered'));
        }
      };
      img.src = imgSrc;
    });
  };

  // ============================================================================
  // LOAD REAL DRAWING FILE (PDF OR IMAGE)
  // ============================================================================
  const loadDrawingSource = useCallback(
    async (source: string | ArrayBuffer, isPdfHint?: boolean, pageNum = 1) => {
      if (!source || (typeof source === 'string' && source.trim() === '')) {
        loadSampleArchitecturalDrawing();
        return;
      }

      setIsLoadingFile(true);
      setLoadError(null);

      // Cancel any in-flight rendering task
      if (currentRenderTaskRef.current) {
        try {
          currentRenderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        currentRenderTaskRef.current = null;
      }

      try {
        // Robust PDF detection checking hint, file name, mime type and magic bytes
        let isPdfSource = isPdfHint;
        if (isPdfSource === undefined) {
          isPdfSource = await checkIsPdfSource(source, fileName);
        } else if (!isPdfSource) {
          isPdfSource = await checkIsPdfSource(source, fileName);
        }

        if (isPdfSource) {
          try {
            setIsPdf(true);
            pageCacheRef.current.clear();
            let doc: pdfjsLib.PDFDocumentProxy;
            if (typeof source === 'string') {
              doc = await pdfjsLib.getDocument({ url: source }).promise;
            } else {
              doc = await pdfjsLib.getDocument({ data: new Uint8Array(source.slice(0)) }).promise;
            }
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setCurrentPage(pageNum);
            setJumpInput(String(pageNum));

            // Render PDF page to offscreen canvas
            const page = await doc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for crisp linework

            const offscreen = document.createElement('canvas');
            offscreen.width = viewport.width;
            offscreen.height = viewport.height;
            const offCtx = offscreen.getContext('2d');

            if (!offCtx) throw new Error('Could not create offscreen canvas context');

            const renderTask = (page as any).render({ canvasContext: offCtx, viewport, canvas: offscreen });
            currentRenderTaskRef.current = renderTask;
            await renderTask.promise;
            currentRenderTaskRef.current = null;

            pageCacheRef.current.set(pageNum, { canvas: offscreen, width: viewport.width, height: viewport.height });
            offscreenCanvasRef.current = offscreen;
            setDrawingDimensions({ width: viewport.width, height: viewport.height });
            setIsSampleDrawing(false);
            setRenderVersion((v) => v + 1);

            autoFitDrawing(viewport.width, viewport.height);
            return;
          } catch (pdfErr: any) {
            if (pdfErr?.name === 'RenderingCancelledException') return;
            console.warn('PDF load attempt failed, trying image fallback:', pdfErr);
            // Fall through to image or blueprint fallback
          }
        }

        // Attempt loading as image (PNG / JPG / WEBP)
        let imgSrc = '';
        let shouldRevoke = false;
        if (typeof source === 'string') {
          imgSrc = source;
        } else {
          const blob = new Blob([source]);
          imgSrc = URL.createObjectURL(blob);
          shouldRevoke = true;
        }

        try {
          const img = await loadImageSafe(imgSrc);
          if (shouldRevoke) URL.revokeObjectURL(imgSrc);

          setIsPdf(false);
          setPdfDoc(null);
          setNumPages(1);
          setCurrentPage(1);
          setJumpInput('1');
          setIsSampleDrawing(false);

          const offscreen = document.createElement('canvas');
          offscreen.width = img.naturalWidth || 1200;
          offscreen.height = img.naturalHeight || 800;
          const offCtx = offscreen.getContext('2d');
          if (!offCtx) throw new Error('Could not create offscreen canvas context');

          offCtx.drawImage(img, 0, 0);
          offscreenCanvasRef.current = offscreen;
          setDrawingDimensions({ width: offscreen.width, height: offscreen.height });
          setRenderVersion((v) => v + 1);

          autoFitDrawing(offscreen.width, offscreen.height);
        } catch (imgErr) {
          if (shouldRevoke) URL.revokeObjectURL(imgSrc);
          // If neither PDF nor direct image loaded, fall back gracefully to the Calibrated Architectural Blueprint!
          console.warn('Drawing source unrenderable, loading Calibrated Blueprint:', imgErr);
          loadSampleArchitecturalDrawing();
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.warn('Drawing load exception, falling back to blueprint:', err);
        loadSampleArchitecturalDrawing();
      } finally {
        setIsLoadingFile(false);
      }
    },
    [checkIsPdfSource, fileName, autoFitDrawing, loadSampleArchitecturalDrawing]
  );

  // Handle Initial File or URL
  useEffect(() => {
    if (fileUrl && fileUrl.trim().length > 0) {
      loadDrawingSource(fileUrl);
    } else {
      loadSampleArchitecturalDrawing();
    }
  }, [fileUrl, loadDrawingSource, loadSampleArchitecturalDrawing]);

  // Handle PDF Page Changes with caching & fast in-flight cancellation
  const handlePageChange = useCallback(async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    setJumpInput(String(newPage));

    // Check page cache first for instantaneous page transitions
    const cached = pageCacheRef.current.get(newPage);
    if (cached) {
      offscreenCanvasRef.current = cached.canvas;
      setDrawingDimensions({ width: cached.width, height: cached.height });
      setRenderVersion((v) => v + 1);
      return;
    }

    setIsLoadingFile(true);

    // Cancel in-flight render if user is clicking through pages rapidly
    if (currentRenderTaskRef.current) {
      try {
        currentRenderTaskRef.current.cancel();
      } catch {
        // ignore cancellation
      }
      currentRenderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(newPage);
      const viewport = page.getViewport({ scale: 2.0 });

      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        const renderTask = (page as any).render({ canvasContext: offCtx, viewport, canvas: offscreen });
        currentRenderTaskRef.current = renderTask;
        await renderTask.promise;
        currentRenderTaskRef.current = null;

        pageCacheRef.current.set(newPage, { canvas: offscreen, width: viewport.width, height: viewport.height });
        offscreenCanvasRef.current = offscreen;
        setDrawingDimensions({ width: viewport.width, height: viewport.height });
        setRenderVersion((v) => v + 1);
      }
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') {
        return;
      }
      console.error('Failed to change page:', err);
    } finally {
      setIsLoadingFile(false);
    }
  }, [pdfDoc, numPages]);

  // If a measurement was targeted for inspection, ensure panel is visible and flip to that page
  useEffect(() => {
    if (highlightMeasurementId) {
      setSelectedMeasurementId(highlightMeasurementId);
      setIsMeasurementsVisible(true);
      const target = measurements.find((m) => m.id === highlightMeasurementId);
      if (target && target.pageNumber && isPdf && target.pageNumber !== currentPage) {
        handlePageChange(target.pageNumber);
      }
    }
  }, [highlightMeasurementId, measurements, isPdf, currentPage, handlePageChange]);

  // Jump to specific page handler
  const handleApplyJump = () => {
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= numPages) {
      handlePageChange(p);
    } else {
      setJumpInput(String(currentPage));
    }
  };

  // Keyboard navigation for multi-page review (PageUp/PageDown, Home/End, or Ctrl+Arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (isPdf && numPages > 1) {
        if (e.key === 'PageUp' || ((e.ctrlKey || e.altKey) && e.key === 'ArrowLeft')) {
          e.preventDefault();
          if (currentPage > 1) handlePageChange(currentPage - 1);
        } else if (e.key === 'PageDown' || ((e.ctrlKey || e.altKey) && e.key === 'ArrowRight')) {
          e.preventDefault();
          if (currentPage < numPages) handlePageChange(currentPage + 1);
        } else if (e.key === 'Home') {
          e.preventDefault();
          handlePageChange(1);
        } else if (e.key === 'End') {
          e.preventDefault();
          handlePageChange(numPages);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPdf, numPages, currentPage, handlePageChange]);

  // Upload local drawing file directly
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveFile(file);
    setFileName(file.name);
    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdfFile) {
      const objectUrl = URL.createObjectURL(file);
      setFileUrl(objectUrl);
      await loadDrawingSource(objectUrl, true, 1);
    } else {
      const reader = new FileReader();
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer;
        await loadDrawingSource(buffer, false, 1);
      };
      reader.readAsArrayBuffer(file);
    }

    // Attempt to save drawing to project backend
    try {
      const formData = new FormData();
      formData.append('drawing', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('projectId', project.id || 'proj-temp');

      const res = await fetch(`/api/projects/${project.id}/drawings`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.drawing && onDrawingUploaded) {
          onDrawingUploaded(data.drawing);
        }
      }
    } catch {
      // Local preview succeeds regardless of network
    }
  };

  // ============================================================================
  // COORDINATE TRANSFORMS
  // ============================================================================
  const screenToDrawing = (screenX: number, screenY: number): { x: number; y: number } => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  const drawingToScreen = (drawingX: number, drawingY: number): { x: number; y: number } => {
    return {
      x: drawingX * zoom + pan.x,
      y: drawingY * zoom + pan.y,
    };
  };

  // Calculate distance between two drawing points
  const calculateDistancePx = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Calculate polygon area in drawing pixels (Shoelace formula)
  const calculatePolygonAreaPx = (pts: Array<{ x: number; y: number }>): number => {
    if (pts.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i].x * pts[j].y;
      area -= pts[j].x * pts[i].y;
    }
    return Math.abs(area) / 2;
  };

  // ============================================================================
  // SCALE CALIBRATION
  // ============================================================================
  const handleConfirmCalibration = () => {
    const realMeters = parseFloat(inputRealMeters);
    if (!realMeters || realMeters <= 0 || tempCalibrationDistancePx <= 0) return;

    const computedPxPerM = tempCalibrationDistancePx / realMeters;
    setPixelsPerMeter(computedPxPerM);
    setIsCalibrated(true);

    // Standard ratio approximation
    const approxRatio = Math.round(100 / (computedPxPerM / 37.79));
    setScaleRatio(approxRatio > 0 ? approxRatio : 100);

    setShowCalibrationModal(false);
    setCalibrationPoints([]);
    setActiveTool('pan');
  };

  // Preset scale selector
  const handleSetStandardScale = (ratio: number) => {
    setScaleRatio(ratio);
    // standard 96dpi screen: 1 meter at 1:100 is ~37.79 pixels
    const pxM = (37.79 * 100) / ratio;
    setPixelsPerMeter(pxM);
    setIsCalibrated(true);
  };

  // ============================================================================
  // INTERACTIVE CANVAS RENDER LOOP
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw dark workspace neutral backdrop
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If drawing exists in offscreen canvas, render it with transform
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (offscreenCanvasRef.current) {
      // Draw white sheet shadow and background
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, drawingDimensions.width, drawingDimensions.height);
      ctx.shadowColor = 'transparent';

      // Draw real drawing content
      ctx.drawImage(offscreenCanvasRef.current, 0, 0);

      // Sheet boundary
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1 / zoom;
      ctx.strokeRect(0, 0, drawingDimensions.width, drawingDimensions.height);
    } else {
      // Empty state on canvas
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, 1000, 700);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 1000, 700);
    }

    // RENDER SAVED MEASUREMENTS OVERLAY
    measurements.forEach((m) => {
      // Filter by PDF page if document has multiple pages and user hasn't toggled showing all
      if (isPdf && m.pageNumber && m.pageNumber !== currentPage && !showAllPagesMeasurements) {
        return;
      }
      const isSelected = m.id === selectedMeasurementId;
      const pts = m.points || [];
      if (pts.length === 0) return;

      if (m.toolType === 'linear' || m.toolType === 'wall') {
        ctx.beginPath();
        ctx.strokeStyle = isSelected ? '#f59e0b' : (m.toolType === 'wall' ? '#0284c7' : '#10b981');
        ctx.lineWidth = (isSelected ? 4 : 3) / zoom;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();

        // End caps
        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#f59e0b' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        });

        // Label badge at midpoint
        if (pts.length >= 2) {
          const midX = (pts[0].x + pts[pts.length - 1].x) / 2;
          const midY = (pts[0].y + pts[pts.length - 1].y) / 2;
          ctx.font = `bold ${Math.max(10, 12 / zoom)}px sans-serif`;
          const badgeText = `${m.label}: ${m.measuredQuantity} ${m.unit}`;
          const textMetrics = ctx.measureText(badgeText);
          const pad = 4 / zoom;

          ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.95)' : 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(
            midX - textMetrics.width / 2 - pad,
            midY - 14 / zoom - pad,
            textMetrics.width + pad * 2,
            18 / zoom + pad
          );
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, midX, midY - 6 / zoom);
        }
      } else if (m.toolType === 'area') {
        if (pts.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();

          ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.25)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#f59e0b' : '#059669';
          ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
          ctx.stroke();

          // Centroid badge
          const avgX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
          const avgY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

          ctx.font = `bold ${Math.max(10, 12 / zoom)}px sans-serif`;
          const badgeText = `${m.label}: ${m.measuredQuantity} m²`;
          const textMetrics = ctx.measureText(badgeText);
          const pad = 4 / zoom;

          ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.95)' : 'rgba(6, 78, 59, 0.88)';
          ctx.fillRect(
            avgX - textMetrics.width / 2 - pad,
            avgY - 10 / zoom - pad,
            textMetrics.width + pad * 2,
            18 / zoom + pad
          );
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, avgX, avgY);
        }
      } else if (m.toolType === 'count') {
        pts.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#f59e0b' : '#8b5cf6';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();

          ctx.font = `bold ${Math.max(9, 10 / zoom)}px sans-serif`;
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${idx + 1}`, p.x, p.y);
        });
      } else if (m.toolType === 'annotation') {
        const p = pts[0];
        if (p) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#e11d48';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();

          // Note box
          ctx.font = `italic ${Math.max(10, 11 / zoom)}px sans-serif`;
          const labelText = m.notes || m.label;
          const textMetrics = ctx.measureText(labelText);
          const pad = 4 / zoom;

          ctx.fillStyle = 'rgba(225, 29, 72, 0.9)';
          ctx.fillRect(p.x + 8 / zoom, p.y - 12 / zoom, textMetrics.width + pad * 2, 18 / zoom + pad);
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, p.x + 8 / zoom + pad, p.y);
        }
      }
    });

    // RENDER IN-PROGRESS MEASUREMENT
    if (currentPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);

      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }

      if (hoverPoint) {
        ctx.lineTo(hoverPoint.x, hoverPoint.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Point markers
      currentPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
      });

      // Live measurement readout
      if (hoverPoint && currentPoints.length > 0) {
        const lastP = currentPoints[currentPoints.length - 1];
        const segDistPx = calculateDistancePx(lastP, hoverPoint);
        const segDistM = segDistPx / pixelsPerMeter;

        const midX = (lastP.x + hoverPoint.x) / 2;
        const midY = (lastP.y + hoverPoint.y) / 2;

        ctx.font = `bold ${Math.max(10, 11 / zoom)}px sans-serif`;
        const readout = `${segDistM.toFixed(2)} m`;
        const metrics = ctx.measureText(readout);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(midX - metrics.width / 2 - 4 / zoom, midY - 14 / zoom, metrics.width + 8 / zoom, 16 / zoom);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(readout, midX, midY - 6 / zoom);
      }
    }

    // RENDER CALIBRATION LINE
    if (calibrationPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 / zoom;
      ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
      if (calibrationPoints.length === 1 && hoverPoint) {
        ctx.lineTo(hoverPoint.x, hoverPoint.y);
      } else if (calibrationPoints.length === 2) {
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
      }
      ctx.stroke();

      calibrationPoints.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 / zoom, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      });
    }

    ctx.restore();
  }, [
    pan,
    zoom,
    drawingDimensions,
    measurements,
    selectedMeasurementId,
    currentPoints,
    hoverPoint,
    calibrationPoints,
    pixelsPerMeter,
    containerDimensions,
    isMeasurementsVisible,
    panelWidth,
    currentPage,
    isPdf,
    renderVersion,
    showAllPagesMeasurements,
  ]);

  // ============================================================================
  // ZOOM & PAN ENGINE (CENTERED ZOOM & MULTI-DIRECTIONAL SHIFT)
  // ============================================================================
  const handleZoomBy = useCallback(
    (factor: number, focalPoint?: { x: number; y: number }) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth || 800;
      const containerHeight = container.clientHeight || 600;

      // Focal point defaults to exact viewport center if not provided (e.g. from toolbar buttons)
      const focusX = focalPoint?.x ?? containerWidth / 2;
      const focusY = focalPoint?.y ?? containerHeight / 2;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(10.0, Math.max(0.1, prevZoom * factor));
        const zoomRatio = nextZoom / prevZoom;

        setPan((prevPan) => ({
          x: Math.round(focusX - (focusX - prevPan.x) * zoomRatio),
          y: Math.round(focusY - (focusY - prevPan.y) * zoomRatio),
        }));

        return nextZoom;
      });
    },
    []
  );

  const handleZoomTo = useCallback(
    (targetZoom: number, focalPoint?: { x: number; y: number }) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth || 800;
      const containerHeight = container.clientHeight || 600;

      const focusX = focalPoint?.x ?? containerWidth / 2;
      const focusY = focalPoint?.y ?? containerHeight / 2;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(10.0, Math.max(0.1, targetZoom));
        const zoomRatio = nextZoom / prevZoom;

        setPan((prevPan) => ({
          x: Math.round(focusX - (focusX - prevPan.x) * zoomRatio),
          y: Math.round(focusY - (focusY - prevPan.y) * zoomRatio),
        }));

        return nextZoom;
      });
    },
    []
  );

  const handlePanBy = useCallback((deltaX: number, deltaY: number) => {
    setPan((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const handlePanToPoint = useCallback(
    (drawingX: number, drawingY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const containerWidth = container.clientWidth || 800;
      const containerHeight = container.clientHeight || 600;

      setPan({
        x: Math.round(containerWidth / 2 - drawingX * zoom),
        y: Math.round(containerHeight / 2 - drawingY * zoom),
      });
    },
    [zoom]
  );

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !drawingDimensions.width) return;
    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 600;

    const scaleW = (containerWidth - 48) / drawingDimensions.width;
    const scaleH = (containerHeight - 48) / drawingDimensions.height;
    const targetZoom = Math.min(scaleW, scaleH, 1.5);

    setZoom(targetZoom);
    setPan({
      x: Math.round((containerWidth - drawingDimensions.width * targetZoom) / 2),
      y: Math.round((containerHeight - drawingDimensions.height * targetZoom) / 2),
    });
  }, [drawingDimensions]);

  // Fit to width
  const handleFitToWidth = useCallback(() => {
    if (!containerRef.current || !drawingDimensions.width) return;
    const containerWidth = containerRef.current.clientWidth || 800;
    const containerHeight = containerRef.current.clientHeight || 600;

    const targetZoom = (containerWidth - 48) / drawingDimensions.width;
    setZoom(targetZoom);
    setPan({
      x: 24,
      y: Math.round((containerHeight - drawingDimensions.height * targetZoom) / 2),
    });
  }, [drawingDimensions]);

  // Global mouse up to ensure pan drag releases cleanly outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Keyboard navigation & pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      const panStep = e.shiftKey ? 240 : 80;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setPan((p) => ({ ...p, y: p.y + panStep }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setPan((p) => ({ ...p, y: p.y - panStep }));
      } else if (e.key === 'ArrowLeft') {
        if (isPdf && numPages > 1 && (e.ctrlKey || e.altKey)) {
          // Handled in PDF page handler
        } else {
          e.preventDefault();
          setPan((p) => ({ ...p, x: p.x + panStep }));
        }
      } else if (e.key === 'ArrowRight') {
        if (isPdf && numPages > 1 && (e.ctrlKey || e.altKey)) {
          // Handled in PDF page handler
        } else {
          e.preventDefault();
          setPan((p) => ({ ...p, x: p.x - panStep }));
        }
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomBy(1.25);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomBy(0.8);
      } else if (e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === '1') {
        e.preventDefault();
        handleZoomTo(1.0);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed, isPdf, numPages, handleZoomBy, handleFitToScreen, handleZoomTo]);

  // ============================================================================
  // MOUSE & POINTER INTERACTIONS (PAN, ZOOM, MEASURE)
  // ============================================================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const drawCoords = screenToDrawing(screenX, screenY);

    // Right-click (2), Middle-click (1), Spacebar pressed, or Pan Tool active -> start panning
    if (e.button === 1 || e.button === 2 || isSpacePressed || activeTool === 'pan') {
      setIsDragging(true);
      setDragStart({ x: screenX - pan.x, y: screenY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Only left click for measurements

    if (activeTool === 'calibrate') {
      const nextPts = [...calibrationPoints, drawCoords];
      if (nextPts.length === 2) {
        setCalibrationPoints(nextPts);
        const distPx = calculateDistancePx(nextPts[0], nextPts[1]);
        setTempCalibrationDistancePx(distPx);
        setShowCalibrationModal(true);
      } else {
        setCalibrationPoints([drawCoords]);
      }
    } else if (activeTool === 'count') {
      // Add individual count item immediately
      const newMeasurement: ManualMeasurement = {
        id: `meas-${Date.now()}`,
        toolType: 'count',
        label: `Count Item ${measurements.filter((m) => m.toolType === 'count').length + 1}`,
        tradeSection: 'Superstructure',
        measuredQuantity: 1,
        unit: 'No',
        scaleRatio,
        dimensions: { count: 1 },
        points: [drawCoords],
        pageNumber: isPdf ? currentPage : 1,
        notes: `Numbered takeoff marker at drawing coords (${Math.round(drawCoords.x)}, ${Math.round(drawCoords.y)})`,
        createdAt: new Date().toISOString(),
        addedToBoq: false,
      };

      const updated = [...measurements, newMeasurement];
      setMeasurements(updated);
      onUpdateProjectMeasurements?.(updated);
    } else if (activeTool === 'annotation') {
      setAnnotationPendingCoord(drawCoords);
      setShowAnnotationModal(true);
    } else if (activeTool === 'length' || activeTool === 'wall' || activeTool === 'area') {
      // Check if closing polygon for area
      if (activeTool === 'area' && currentPoints.length >= 3) {
        const startP = currentPoints[0];
        const distToStart = calculateDistancePx(drawCoords, startP);
        if (distToStart < 15 / zoom) {
          finishAreaMeasurement();
          return;
        }
      }
      setCurrentPoints((prev) => [...prev, drawCoords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isDragging) {
      setPan({
        x: screenX - dragStart.x,
        y: screenY - dragStart.y,
      });
      return;
    }

    const drawCoords = screenToDrawing(screenX, screenY);
    setHoverPoint(drawCoords);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel & trackpad handler: smooth panning + cursor-focal zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Trackpad pinch-to-zoom OR Ctrl/Meta + wheel -> zoom into cursor
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      handleZoomBy(zoomFactor, { x: mouseX, y: mouseY });
      return;
    }

    // Horizontal trackpad gesture or Shift + wheel -> Pan horizontally
    if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
      const dX = e.shiftKey ? e.deltaY : e.deltaX;
      setPan((prev) => ({
        x: prev.x - dX,
        y: prev.y - (e.shiftKey ? 0 : e.deltaY),
      }));
      return;
    }

    // For vertical wheel motion:
    if (wheelScrollMode === 'pan') {
      setPan((prev) => ({
        x: prev.x,
        y: prev.y - e.deltaY,
      }));
    } else {
      // Default: smooth zoom centered on cursor
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      handleZoomBy(zoomFactor, { x: mouseX, y: mouseY });
    }
  };

  // Touch handlers for mobile & touchscreen devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const screenX = t.clientX - rect.left;
      const screenY = t.clientY - rect.top;
      touchStartRef.current = { x: screenX, y: screenY };
      if (activeTool === 'pan' || isSpacePressed) {
        setIsDragging(true);
        setDragStart({ x: screenX - pan.x, y: screenY - pan.y });
      }
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;
      touchStartRef.current = { x: midX, y: midY, dist };
      setIsDragging(true);
      setDragStart({ x: midX - pan.x, y: midY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const screenX = t.clientX - rect.left;
      const screenY = t.clientY - rect.top;
      setPan({
        x: screenX - dragStart.x,
        y: screenY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const midY = (t1.clientY + t2.clientY) / 2 - rect.top;

      if (touchStartRef.current.dist && touchStartRef.current.dist > 0) {
        const factor = dist / touchStartRef.current.dist;
        handleZoomBy(factor, { x: midX, y: midY });
        touchStartRef.current.dist = dist;
      }

      setPan({
        x: midX - dragStart.x,
        y: midY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = { x: 0, y: 0 };
  };

  // Double click to finish length or area
  const handleDoubleClick = () => {
    if (activeTool === 'length') {
      finishLengthMeasurement();
    } else if (activeTool === 'area') {
      finishAreaMeasurement();
    } else if (activeTool === 'wall') {
      finishWallMeasurement();
    }
  };

  // Finish linear measurement
  const finishLengthMeasurement = () => {
    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }

    let totalDistPx = 0;
    for (let i = 0; i < currentPoints.length - 1; i++) {
      totalDistPx += calculateDistancePx(currentPoints[i], currentPoints[i + 1]);
    }

    const totalM = parseFloat((totalDistPx / pixelsPerMeter).toFixed(2));
    const newMeas: ManualMeasurement = {
      id: `meas-${Date.now()}`,
      toolType: 'linear',
      label: `Linear Run (${totalM}m)`,
      tradeSection: 'Substructure',
      measuredQuantity: totalM,
      unit: 'm',
      scaleRatio,
      dimensions: { length: totalM },
      points: currentPoints,
      pageNumber: isPdf ? currentPage : 1,
      notes: `Linear measurement on ${fileName || 'Drawing'} at scale 1:${scaleRatio}`,
      createdAt: new Date().toISOString(),
      addedToBoq: false,
    };

    const updated = [...measurements, newMeas];
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
    setCurrentPoints([]);
    setSelectedMeasurementId(newMeas.id);
  };

  // Finish polygon area measurement
  const finishAreaMeasurement = () => {
    if (currentPoints.length < 3) {
      setCurrentPoints([]);
      return;
    }

    const areaPx = calculatePolygonAreaPx(currentPoints);
    const areaM2 = parseFloat((areaPx / (pixelsPerMeter * pixelsPerMeter)).toFixed(2));

    const newMeas: ManualMeasurement = {
      id: `meas-${Date.now()}`,
      toolType: 'area',
      label: `Floor/Slab Area (${areaM2}m²)`,
      tradeSection: 'Substructure',
      measuredQuantity: areaM2,
      unit: 'm2',
      scaleRatio,
      dimensions: { area: areaM2 },
      points: currentPoints,
      pageNumber: isPdf ? currentPage : 1,
      notes: `Measured polygon area on ${fileName || 'Drawing'}`,
      createdAt: new Date().toISOString(),
      addedToBoq: false,
    };

    const updated = [...measurements, newMeas];
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
    setCurrentPoints([]);
    setSelectedMeasurementId(newMeas.id);
  };

  // Finish wall run measurement
  const finishWallMeasurement = () => {
    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }
    setShowWallConfig(true);
  };

  const handleConfirmWallMeasurement = () => {
    let totalDistPx = 0;
    for (let i = 0; i < currentPoints.length - 1; i++) {
      totalDistPx += calculateDistancePx(currentPoints[i], currentPoints[i + 1]);
    }
    const wallLengthM = parseFloat((totalDistPx / pixelsPerMeter).toFixed(2));
    const grossAreaM2 = wallLengthM * wallHeight;
    const netAreaM2 = Math.max(0, parseFloat((grossAreaM2 - wallDeductionsM2).toFixed(2)));

    const newMeas: ManualMeasurement = {
      id: `meas-${Date.now()}`,
      toolType: 'wall',
      label: `${wallThicknessMm}mm Sandcrete Blockwork Wall`,
      tradeSection: 'Superstructure',
      measuredQuantity: netAreaM2,
      unit: 'm2',
      scaleRatio,
      dimensions: {
        length: wallLengthM,
        height: wallHeight,
        depth: wallThicknessMm / 1000,
        area: netAreaM2,
        deductions: wallDeductionsM2,
      },
      points: currentPoints,
      pageNumber: isPdf ? currentPage : 1,
      notes: `Wall length: ${wallLengthM}m × height ${wallHeight}m less ${wallDeductionsM2}m² openings = ${netAreaM2}m²`,
      createdAt: new Date().toISOString(),
      addedToBoq: false,
    };

    const updated = [...measurements, newMeas];
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
    setCurrentPoints([]);
    setShowWallConfig(false);
    setSelectedMeasurementId(newMeas.id);
  };

  // Finish annotation note
  const handleConfirmAnnotation = () => {
    if (!annotationPendingCoord || !annotationText.trim()) return;

    const newMeas: ManualMeasurement = {
      id: `meas-${Date.now()}`,
      toolType: 'annotation',
      label: annotationText.trim().slice(0, 30),
      tradeSection: 'General Works',
      measuredQuantity: 1,
      unit: 'Item',
      scaleRatio,
      dimensions: {},
      points: [annotationPendingCoord],
      pageNumber: isPdf ? currentPage : 1,
      notes: annotationText.trim(),
      createdAt: new Date().toISOString(),
      addedToBoq: false,
    };

    const updated = [...measurements, newMeas];
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
    setAnnotationPendingCoord(null);
    setAnnotationText('');
    setShowAnnotationModal(false);
  };

  // Convert measurement to BOQ Item
  const handleAddMeasurementToBoq = (meas: ManualMeasurement) => {
    const defaultRates: Record<string, number> = {
      m2: meas.tradeSection === 'Superstructure' ? 13500 : 8500,
      m: 4500,
      m3: 115000,
      No: 65000,
      Item: 25000,
    };
    const rate = defaultRates[meas.unit] || 12000;

    onAddBoqItem({
      item: meas.label,
      description: `${meas.notes || meas.label} (Calibrated Takeoff on ${fileName || 'Architectural Plan'}, Scale 1:${meas.scaleRatio})`,
      unit: meas.unit,
      qty: meas.measuredQuantity,
      rate,
      amount: meas.measuredQuantity * rate,
      section: meas.tradeSection || 'Superstructure',
      source: 'MANUAL_TAKEOFF',
      source_drawing: fileName || 'Uploaded Architectural Drawing',
      page_or_sheet: isPdf ? `Sheet Page ${currentPage}` : 'Sheet 1',
      measurement_method: `Calibrated Manual ${meas.toolType.toUpperCase()} Takeoff`,
      calculation_formula: meas.notes || `${meas.measuredQuantity} ${meas.unit}`,
      drawing_evidence_id: meas.id,
      verification_status: 'QS Verified',
      is_confirmed: true,
    });

    const updated = measurements.map((m) =>
      m.id === meas.id ? { ...m, addedToBoq: true } : m
    );
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
  };

  // Delete measurement
  const handleDeleteMeasurement = (id: string) => {
    const updated = measurements.filter((m) => m.id !== id);
    setMeasurements(updated);
    onUpdateProjectMeasurements?.(updated);
    if (selectedMeasurementId === id) {
      setSelectedMeasurementId(null);
    }
  };

  return (
    <div className="flex flex-col h-[820px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* TOP CONTROL TOOLBAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: Active File Info & Upload Trigger */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-800/60 rounded-lg border border-emerald-700/50">
              <FileText className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-200 truncate max-w-[200px] sm:max-w-[320px]">
                {fileName || 'No Drawing Uploaded'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isPdf ? `PDF Document (${numPages} Pages)` : 'Architectural Drawing Image'}
              </p>
            </div>
          </div>

          {/* Upload New Drawing Button */}
          <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition inline-flex items-center space-x-1.5">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Drawing</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Center: Multi-Page PDF Review & Navigation Suite */}
        {isPdf && numPages > 1 && (
          <div className="flex items-center space-x-1.5 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-slate-700 shadow-xs">
            {/* Quick First Page button */}
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1 || isLoadingFile}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer rounded transition"
              title="First Page (Home)"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* PREVIOUS PAGE BUTTON (Prominent with text & icon) */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoadingFile}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 disabled:opacity-30 disabled:hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white rounded-lg transition cursor-pointer border border-slate-600/50"
              title="Previous Page (Left Arrow or PageUp)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Page Jump Input & Counter */}
            <div className="flex items-center space-x-1 px-2 py-0.5 bg-slate-900/90 rounded-lg border border-slate-700 font-mono text-xs">
              <span className="text-slate-400 text-[11px]">Pg</span>
              <input
                type="number"
                min={1}
                max={numPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onBlur={handleApplyJump}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyJump();
                }}
                className="w-10 text-center font-bold text-emerald-400 bg-transparent outline-none focus:bg-slate-800 rounded px-1 py-0.5"
                title={`Jump directly to any page between 1 and ${numPages}`}
              />
              <span className="text-slate-400">/ {numPages}</span>
            </div>

            {/* NEXT PAGE BUTTON (Prominent with text & accent color) */}
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages || isLoadingFile}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-800 text-xs font-bold text-white rounded-lg transition cursor-pointer border border-emerald-700 shadow-xs"
              title="Next Page (Right Arrow or PageDown)"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Last Page button */}
            <button
              type="button"
              onClick={() => handlePageChange(numPages)}
              disabled={currentPage >= numPages || isLoadingFile}
              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer rounded transition"
              title={`Last Page (${numPages})`}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* Sheet/Page Browser Drawer Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isMeasurementsVisible) {
                  setIsMeasurementsVisible(true);
                }
                setSidebarTab('sheets');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ml-1 ${
                sidebarTab === 'sheets' && isMeasurementsVisible
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
              title="Open multi-page sheets browser"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline text-[11px]">Pages ({numPages})</span>
            </button>
          </div>
        )}

        {/* Right: Scale & Calibration Indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <Ruler className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Scale:</span>
            <select
              value={scaleRatio}
              onChange={(e) => handleSetStandardScale(Number(e.target.value))}
              className="bg-transparent font-bold text-white outline-none cursor-pointer"
            >
              <option value="50" className="bg-slate-800">1:50</option>
              <option value="100" className="bg-slate-800">1:100</option>
              <option value="200" className="bg-slate-800">1:200</option>
              <option value="500" className="bg-slate-800">1:500</option>
            </select>
            {isCalibrated ? (
              <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold ml-1">
                <Check className="w-3 h-3 mr-0.5" /> Calibrated
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTool('calibrate');
              setCalibrationPoints([]);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              activeTool === 'calibrate'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30'
            }`}
            title="Click two known points on the drawing to calibrate scale"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Calibrate</span>
          </button>
        </div>
      </div>

      {/* SUB-TOOLBAR: TAKEOFF TOOLS & ZOOM */}
      <div className="bg-slate-800/90 border-b border-slate-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Takeoff Tools */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setActiveTool('pan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'pan' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Pan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('length');
              setCurrentPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'length' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Length (m)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('area');
              setCurrentPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'area' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Area (m²)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('wall');
              setCurrentPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'wall' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Wall Area (m²)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('count');
              setCurrentPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'count' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Count</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('annotation');
              setCurrentPoints([]);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTool === 'annotation' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Annotate</span>
          </button>
        </div>

        {/* Right: Viewport Controls */}
        <div className="flex items-center space-x-2">
          {currentPoints.length > 1 && (
            <button
              type="button"
              onClick={handleDoubleClick}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-xs animate-pulse"
            >
              Finish Measurement (Done)
            </button>
          )}

          {/* Wheel Scroll Mode Toggle */}
          <button
            type="button"
            onClick={() => setWheelScrollMode((m) => (m === 'zoom' ? 'pan' : 'zoom'))}
            className={`px-2 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center space-x-1 ${
              wheelScrollMode === 'pan'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={
              wheelScrollMode === 'pan'
                ? 'Wheel Mode: Pan/Scroll Sheet (Click to switch to Wheel Zoom)'
                : 'Wheel Mode: Zoom into Cursor (Click to switch to Wheel Pan)'
            }
          >
            <Move className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline">{wheelScrollMode === 'pan' ? 'Scroll: Pan' : 'Scroll: Zoom'}</span>
          </button>

          {/* Centered Zoom & Presets Menu */}
          <div className="inline-flex items-center space-x-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700 relative">
            <button
              type="button"
              onClick={() => handleZoomBy(0.8)}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer transition hover:bg-slate-800"
              title="Zoom Out (Centered, or press -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom presets trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowZoomPresetsMenu(!showZoomPresetsMenu)}
                className="text-xs font-mono font-bold text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 flex items-center space-x-0.5 cursor-pointer"
                title="Select zoom level or fit"
              >
                <span>{Math.round(zoom * 100)}%</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showZoomPresetsMenu && (
                <div className="absolute top-full mt-1.5 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 min-w-[130px] text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      handleFitToScreen();
                      setShowZoomPresetsMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-emerald-400 flex items-center justify-between"
                  >
                    <span>Fit Screen</span>
                    <span className="text-[10px] text-slate-500">0</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleFitToWidth();
                      setShowZoomPresetsMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-emerald-400"
                  >
                    Fit Width
                  </button>
                  <div className="h-px bg-slate-800 my-1" />
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        handleZoomTo(level);
                        setShowZoomPresetsMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1 hover:bg-slate-800 flex items-center justify-between ${
                        Math.abs(zoom - level) < 0.05
                          ? 'text-emerald-400 font-bold bg-emerald-950/40'
                          : 'text-slate-300'
                      }`}
                    >
                      <span>{Math.round(level * 100)}%</span>
                      {Math.abs(zoom - level) < 0.05 && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleZoomBy(1.25)}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer transition hover:bg-slate-800"
              title="Zoom In (Centered, or press +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer ml-0.5 hover:bg-slate-800"
              title="Fit to Screen (0)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Show / Hide Measurements Panel Toggle */}
          <button
            type="button"
            onClick={toggleMeasurementsVisibility}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border ${
              isMeasurementsVisible
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title={isMeasurementsVisible ? 'Hide measurements section to maximize drawing view' : 'Show measurements section'}
          >
            {isMeasurementsVisible ? (
              <>
                <PanelRightClose className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Hide Measurements</span>
              </>
            ) : (
              <>
                <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Show Measurements ({measurements.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE: CANVAS + MEASUREMENTS SIDE PANEL */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* INTERACTIVE CANVAS CONTAINER */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-crosshair select-none"
          style={{ cursor: isSpacePressed || activeTool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair' }}
        >
          {/* Floating Show Measurements button when hidden */}
          {!isMeasurementsVisible && (
            <button
              type="button"
              onClick={toggleMeasurementsVisibility}
              className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50 rounded-xl text-xs font-bold shadow-xl flex items-center space-x-1.5 backdrop-blur-xs transition cursor-pointer group"
              title="Show measurements section"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Measurements</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                {measurements.length}
              </span>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
            </button>
          )}

          {/* Calibrated Sample Architectural Drawing Indicator */}
          {isSampleDrawing && (
            <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-slate-900/95 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-xs text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Calibrated Sample Architectural Blueprint (1:100)</span>
              <label className="ml-2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold cursor-pointer transition shadow-xs">
                Upload My Plan
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
          {isLoadingFile && (
            <div className="absolute inset-0 bg-slate-950/75 z-20 flex flex-col items-center justify-center text-white space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-emerald-400">Rendering Real Architectural Drawing...</p>
            </div>
          )}

          {loadError && (
            <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-slate-200">Unable to Display Drawing</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md">{loadError}</p>
              <label className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer">
                Upload Replacement Drawing
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full block"
          />

          {/* Quick Navigation Tip (Auto-dismisses or stays subtle) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center space-x-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-700/60 text-[11px] text-slate-300 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Right-click & drag to shift view anytime • Space + drag • Arrow keys</span>
          </div>

          {/* Floating Interactive Minimap / Sheet Navigator */}
          {showMinimap && offscreenCanvasRef.current && (
            <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl p-2 backdrop-blur-md flex flex-col space-y-1.5 select-none">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1 text-[11px] font-bold text-slate-300">
                <div className="flex items-center space-x-1 text-emerald-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Sheet Navigator</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMinimap(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Hide sheet navigator"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Minimap Canvas with Highlighted Viewport Box */}
              <div
                className="relative cursor-pointer overflow-hidden rounded-lg border border-slate-700/80 bg-slate-950 flex items-center justify-center group"
                style={{ width: `${minimapWidth}px`, height: `${minimapHeight}px` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  const targetDrawX = clickX / minimapScaleX;
                  const targetDrawY = clickY / minimapScaleY;
                  handlePanToPoint(targetDrawX, targetDrawY);
                }}
                title="Click anywhere to center view on that room or section"
              >
                <canvas
                  ref={minimapCanvasRef}
                  width={minimapWidth}
                  height={minimapHeight}
                  className="w-full h-full block pointer-events-none"
                />
                {/* Active Viewport Rectangle */}
                <div
                  style={{
                    left: `${minimapViewportLeft}px`,
                    top: `${minimapViewportTop}px`,
                    width: `${minimapViewportWidth}px`,
                    height: `${minimapViewportHeight}px`,
                  }}
                  className="absolute border-2 border-emerald-400 bg-emerald-500/25 rounded-xs pointer-events-none shadow-md transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Click area to shift</span>
                <button
                  type="button"
                  onClick={handleFitToScreen}
                  className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold cursor-pointer"
                >
                  Fit Sheet
                </button>
              </div>
            </div>
          )}

          {/* Collapsed Navigator Button */}
          {!showMinimap && (
            <button
              type="button"
              onClick={() => setShowMinimap(true)}
              className="absolute bottom-4 left-4 z-20 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50 rounded-xl text-xs font-bold shadow-xl flex items-center space-x-1.5 backdrop-blur-xs transition cursor-pointer"
              title="Show Sheet Navigator / Minimap"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Navigator</span>
            </button>
          )}

          {/* Directional Pan D-Pad (Nudge & Shift View) */}
          <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl p-1 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => handlePanBy(0, 150)}
              className="p-1 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Shift View Up (Arrow Up)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handlePanBy(150, 0)}
                className="p-1 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Shift View Left (Arrow Left)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFitToScreen}
                className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition cursor-pointer"
                title="Reset / Center View to Fit (0)"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePanBy(-150, 0)}
                className="p-1 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                title="Shift View Right (Arrow Right)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handlePanBy(0, -150)}
              className="p-1 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Shift View Down (Arrow Down)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Floating On-Canvas PDF Page Navigation Bar */}
          {isPdf && numPages > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-700/80 shadow-2xl">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoadingFile}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-xl transition cursor-pointer border border-slate-600/50 shadow-xs"
                title="Previous Page (Left Arrow or PageUp)"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-400" />
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-slate-300">
                <span className="text-slate-400 font-sans text-[11px]">Reviewing</span>
                <span className="font-bold text-emerald-400">{currentPage}</span>
                <span className="text-slate-500">/</span>
                <span className="font-bold text-slate-200">{numPages}</span>
                <span className="text-slate-500 text-[10px] hidden sm:inline">pages</span>
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= numPages || isLoadingFile}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-800 text-xs font-bold text-white rounded-xl transition cursor-pointer border border-emerald-600/50 shadow-xs"
                title="Next Page (Right Arrow or PageDown)"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Calibrate Guide Overlay */}
          {activeTool === 'calibrate' && (
            <div className="absolute top-4 left-4 bg-amber-500/90 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center space-x-2 pointer-events-none">
              <Ruler className="w-4 h-4" />
              <span>
                {calibrationPoints.length === 0
                  ? 'Click Point A on known drawing dimension'
                  : 'Now click Point B to calibrate real distance'}
              </span>
            </div>
          )}
        </div>

        {/* RESIZABLE SPLITTER HANDLE */}
        {isMeasurementsVisible && (
          <div
            onMouseDown={handleStartResize}
            className={`w-2.5 hover:w-3 bg-slate-800/90 hover:bg-emerald-500 cursor-col-resize transition-all z-20 select-none flex items-center justify-center relative shrink-0 group border-l border-slate-700/50 ${
              isResizingPanel ? 'bg-emerald-500 ring-2 ring-emerald-400/50' : ''
            }`}
            title="Drag horizontally to adjust measurements section width"
          >
            <div className="h-8 w-1 rounded-full bg-slate-500 group-hover:bg-white transition-colors" />
          </div>
        )}

        {/* MEASUREMENT DRAWER / SIDE PANEL */}
        {isMeasurementsVisible && (
          <div
            style={{ width: `${panelWidth}px` }}
            className="border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden text-slate-200 shrink-0"
          >
            {/* Header with Title, Width Presets & Collapse Button */}
            <div className="p-2.5 border-b border-slate-800 flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setSidebarTab('measurements')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition ${
                    sidebarTab === 'measurements'
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Items ({measurements.length})</span>
                </button>

                {isPdf && numPages > 1 && (
                  <button
                    type="button"
                    onClick={() => setSidebarTab('sheets')}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition ${
                      sidebarTab === 'sheets'
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Pages ({numPages})</span>
                  </button>
                )}
              </div>

              {/* Quick width presets & Hide button */}
              <div className="flex items-center space-x-1 shrink-0">
                {/* Preset width selector */}
                <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPanelWidth(200);
                      safeStorage.setItem('takeoff_measurements_width', '200');
                    }}
                    className={`px-1.5 py-0.5 rounded transition ${panelWidth <= 220 ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Compact width (200px)"
                  >
                    S
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelWidth(260);
                      safeStorage.setItem('takeoff_measurements_width', '260');
                    }}
                    className={`px-1.5 py-0.5 rounded transition ${panelWidth > 220 && panelWidth <= 300 ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Normal width (260px)"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPanelWidth(360);
                      safeStorage.setItem('takeoff_measurements_width', '360');
                    }}
                    className={`px-1.5 py-0.5 rounded transition ${panelWidth > 300 ? 'bg-emerald-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Wide width (360px)"
                  >
                    L
                  </button>
                </div>

                {/* Hide button */}
                <button
                  type="button"
                  onClick={toggleMeasurementsVisibility}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition cursor-pointer"
                  title="Hide measurements section"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-bar for Multi-Page Filtering when in measurements tab */}
            {sidebarTab === 'measurements' && isPdf && numPages > 1 && (
              <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Filter Scope:</span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowAllPagesMeasurements(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      !showAllPagesMeasurements
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Page {currentPage} Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllPagesMeasurements(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                      showAllPagesMeasurements
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All {numPages} Pages
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SHEETS BROWSER */}
            {sidebarTab === 'sheets' && isPdf && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    All PDF Pages ({numPages})
                  </span>
                  <span className="text-[10px] text-slate-500">Click to jump</span>
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => {
                    const isCur = pg === currentPage;
                    const pageMeasCount = measurements.filter((m) => m.pageNumber === pg).length;
                    return (
                      <div
                        key={pg}
                        onClick={() => handlePageChange(pg)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                          isCur
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${
                              isCur ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {pg}
                          </span>
                          <div>
                            <span className="font-bold block">Page {pg}</span>
                            <span className="text-[10px] text-slate-400">
                              {pg === currentPage ? 'Currently Viewing' : 'Review Sheet'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {pageMeasCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                              {pageMeasCount} items
                            </span>
                          )}
                          {isCur && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: MEASUREMENTS LIST */}
            {sidebarTab === 'measurements' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {(() => {
                  const visibleMeasurements = isPdf && !showAllPagesMeasurements
                    ? measurements.filter((m) => !m.pageNumber || m.pageNumber === currentPage)
                    : measurements;

                  if (visibleMeasurements.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-500">
                        <Ruler className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-xs font-bold text-slate-400">
                          {isPdf && !showAllPagesMeasurements
                            ? `No Items on Page ${currentPage}`
                            : 'No Measurements Yet'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto">
                          Select a tool above (Length, Area, Wall, Count) and measure directly on the drawing.
                        </p>
                        {isPdf && !showAllPagesMeasurements && measurements.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAllPagesMeasurements(true)}
                            className="mt-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold cursor-pointer"
                          >
                            View All {measurements.length} Items
                          </button>
                        )}
                      </div>
                    );
                  }

                  return visibleMeasurements.map((m) => {
                    const isSelected = m.id === selectedMeasurementId;
                    const isDiffPage = isPdf && m.pageNumber && m.pageNumber !== currentPage;

                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setSelectedMeasurementId(m.id);
                          if (isDiffPage && m.pageNumber) {
                            handlePageChange(m.pageNumber);
                          }
                        }}
                        className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-slate-800/90 border-emerald-500 shadow-xs'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                                {m.toolType}
                              </span>
                              {isPdf && m.pageNumber && (
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                    m.pageNumber === currentPage
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-700/80 text-slate-400'
                                  }`}
                                  title={`Measured on Page ${m.pageNumber}`}
                                >
                                  Pg {m.pageNumber}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-200 mt-1">{m.label}</h4>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMeasurement(m.id);
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                              title="Delete Measurement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-700/50 pt-2">
                          <span className="font-mono text-sm font-black text-emerald-400">
                            {m.measuredQuantity} {m.unit}
                          </span>

                          {m.addedToBoq ? (
                            <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Added to BOQ
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddMeasurementToBoq(m);
                              }}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer transition flex items-center space-x-1"
                            >
                              <span>Add to BOQ</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {m.notes && (
                          <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-2">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CALIBRATION MODAL */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
            <div className="flex items-center space-x-2 text-amber-400 mb-3">
              <Ruler className="w-5 h-5" />
              <h3 className="font-black text-base">Calibrate Drawing Scale</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              Enter the real-world distance between the two selected points on the drawing:
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  value={inputRealMeters}
                  onChange={(e) => setInputRealMeters(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none focus:border-amber-500"
                  placeholder="e.g. 4.5"
                  autoFocus
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">meters</span>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-1.5">
                {['3.0', '4.5', '6.0', '10.0'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInputRealMeters(p)}
                    className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-mono cursor-pointer"
                  >
                    {p}m
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCalibrationModal(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCalibration}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-white cursor-pointer shadow-xs"
                >
                  Apply Calibration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALL CONFIG MODAL */}
      {showWallConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
            <div className="flex items-center space-x-2 text-blue-400 mb-3">
              <Box className="w-5 h-5" />
              <h3 className="font-black text-base">Wall Area Takeoff Parameters</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Wall Height (meters):</label>
                <input
                  type="number"
                  step="0.1"
                  value={wallHeight}
                  onChange={(e) => setWallHeight(parseFloat(e.target.value) || 3.0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Wall Thickness (Sandcrete):</label>
                <select
                  value={wallThicknessMm}
                  onChange={(e) => setWallThicknessMm(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="225">225mm External Blockwork</option>
                  <option value="150">150mm Internal Partition</option>
                  <option value="100">100mm Dwarf Wall</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Deductions for Doors &amp; Windows (m²):</label>
                <input
                  type="number"
                  step="0.5"
                  value={wallDeductionsM2}
                  onChange={(e) => setWallDeductionsM2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="0.0"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowWallConfig(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWallMeasurement}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white cursor-pointer shadow-xs"
                >
                  Calculate &amp; Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANNOTATION MODAL */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
            <div className="flex items-center space-x-2 text-rose-400 mb-3">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-black text-base">Add Drawing Annotation</h3>
            </div>

            <textarea
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              placeholder="e.g. Check foundation depth with structural engineer"
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500"
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowAnnotationModal(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAnnotation}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                Place Annotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
