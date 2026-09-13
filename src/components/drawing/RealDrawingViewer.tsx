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
  Upload,
  AlertCircle,
  Eye,
  Sliders,
  Layers,
  RotateCcw,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen,
  GripVertical
} from 'lucide-react';
import { Project, ManualMeasurement, BoqItem, DrawingSheet } from '../../types';
import { formatNaira } from '../../utils/format';

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
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      const saved = localStorage.getItem('takeoff_measurements_visible');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('takeoff_measurements_width');
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
      try {
        localStorage.setItem('takeoff_measurements_width', panelWidth.toString());
      } catch {}
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
      try {
        localStorage.setItem('takeoff_measurements_visible', String(next));
      } catch {}
      return next;
    });
  };

  // If a measurement was targeted for inspection, ensure panel is visible
  useEffect(() => {
    if (highlightMeasurementId) {
      setSelectedMeasurementId(highlightMeasurementId);
      setIsMeasurementsVisible(true);
    }
  }, [highlightMeasurementId]);

  // ============================================================================
  // LOAD REAL DRAWING FILE (PDF OR IMAGE)
  // ============================================================================
  const loadDrawingSource = useCallback(async (source: string | ArrayBuffer, isPdfSource: boolean, pageNum = 1) => {
    setIsLoadingFile(true);
    setLoadError(null);

    try {
      if (isPdfSource) {
        setIsPdf(true);
        let doc: pdfjsLib.PDFDocumentProxy;
        if (typeof source === 'string') {
          doc = await pdfjsLib.getDocument({ url: source }).promise;
        } else {
          doc = await pdfjsLib.getDocument({ data: source }).promise;
        }
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(pageNum);

        // Render PDF page to offscreen canvas
        const page = await doc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for crisp architectural linework

        const offscreen = document.createElement('canvas');
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const offCtx = offscreen.getContext('2d');

        if (!offCtx) throw new Error('Could not create offscreen canvas context');

        await (page as any).render({ canvasContext: offCtx, viewport, canvas: offscreen }).promise;

        offscreenCanvasRef.current = offscreen;
        setDrawingDimensions({ width: viewport.width, height: viewport.height });

        // Auto-fit to screen
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth || 800;
          const containerHeight = containerRef.current.clientHeight || 600;
          const scaleW = (containerWidth - 40) / viewport.width;
          const scaleH = (containerHeight - 40) / viewport.height;
          const initialZoom = Math.min(scaleW, scaleH, 1);
          setZoom(Math.max(0.2, initialZoom));
          setPan({
            x: Math.round((containerWidth - viewport.width * initialZoom) / 2),
            y: Math.round((containerHeight - viewport.height * initialZoom) / 2),
          });
        }
      } else {
        // Image source (PNG / JPG / WEBP)
        setIsPdf(false);
        setPdfDoc(null);
        setNumPages(1);

        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load drawing image'));
          if (typeof source === 'string') {
            img.src = source;
          } else {
            const blob = new Blob([source]);
            img.src = URL.createObjectURL(blob);
          }
        });

        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth || 1200;
        offscreen.height = img.naturalHeight || 800;
        const offCtx = offscreen.getContext('2d');
        if (!offCtx) throw new Error('Could not create offscreen canvas context');

        offCtx.drawImage(img, 0, 0);
        offscreenCanvasRef.current = offscreen;
        setDrawingDimensions({ width: offscreen.width, height: offscreen.height });

        // Auto-fit to screen
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth || 800;
          const containerHeight = containerRef.current.clientHeight || 600;
          const scaleW = (containerWidth - 40) / offscreen.width;
          const scaleH = (containerHeight - 40) / offscreen.height;
          const initialZoom = Math.min(scaleW, scaleH, 1);
          setZoom(Math.max(0.2, initialZoom));
          setPan({
            x: Math.round((containerWidth - offscreen.width * initialZoom) / 2),
            y: Math.round((containerHeight - offscreen.height * initialZoom) / 2),
          });
        }
      }
    } catch (err: any) {
      console.error('Error loading drawing:', err);
      setLoadError(err?.message || 'Failed to render drawing.');
    } finally {
      setIsLoadingFile(false);
    }
  }, []);

  // Handle Initial File or URL
  useEffect(() => {
    if (fileUrl) {
      const isPdfUrl = fileUrl.toLowerCase().includes('.pdf') || fileUrl.includes('application/pdf');
      loadDrawingSource(fileUrl, isPdfUrl, 1);
    }
  }, [fileUrl, loadDrawingSource]);

  // Handle PDF Page Changes
  const handlePageChange = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    setIsLoadingFile(true);

    try {
      const page = await pdfDoc.getPage(newPage);
      const viewport = page.getViewport({ scale: 2.0 });

      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        await page.render({ canvasContext: offCtx, viewport }).promise;
        offscreenCanvasRef.current = offscreen;
        setDrawingDimensions({ width: viewport.width, height: viewport.height });
      }
    } catch (err) {
      console.error('Failed to change page:', err);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Upload local drawing file directly
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveFile(file);
    setFileName(file.name);
    const isPdfFile = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    const reader = new FileReader();
    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      await loadDrawingSource(buffer, isPdfFile, 1);

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
    reader.readAsArrayBuffer(file);
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
  ]);

  // ============================================================================
  // MOUSE & POINTER INTERACTIONS (PAN, ZOOM, MEASURE)
  // ============================================================================
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const drawCoords = screenToDrawing(screenX, screenY);

    // Middle click or Spacebar or Pan Tool -> start panning
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
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

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(8.0, Math.max(0.15, zoom * zoomFactor));

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
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

  // Fit to screen
  const handleFitToScreen = () => {
    if (!containerRef.current || !drawingDimensions.width) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleW = (containerWidth - 48) / drawingDimensions.width;
    const scaleH = (containerHeight - 48) / drawingDimensions.height;
    const targetZoom = Math.min(scaleW, scaleH, 1.5);

    setZoom(targetZoom);
    setPan({
      x: Math.round((containerWidth - drawingDimensions.width * targetZoom) / 2),
      y: Math.round((containerHeight - drawingDimensions.height * targetZoom) / 2),
    });
  };

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
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
  }, [isSpacePressed]);

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

        {/* Center: PDF Page Navigation */}
        {isPdf && numPages > 1 && (
          <div className="flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoadingFile}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200">
              Page {currentPage} / {numPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= numPages || isLoadingFile}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
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

          <div className="inline-flex items-center space-x-1 bg-slate-900/60 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(6.0, z * 1.25))}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1 text-slate-300 hover:text-white rounded cursor-pointer ml-1"
              title="Fit to Screen"
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
            className="w-full h-full block"
          />

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
              <div className="flex items-center space-x-1.5 min-w-0">
                <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
                  Measurements ({measurements.length})
                </h3>
              </div>

              {/* Quick width presets & Hide button */}
              <div className="flex items-center space-x-1 shrink-0">
                {/* Preset width selector */}
                <div className="flex items-center bg-slate-800 rounded p-0.5 border border-slate-700 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setPanelWidth(200);
                      try { localStorage.setItem('takeoff_measurements_width', '200'); } catch {}
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
                      try { localStorage.setItem('takeoff_measurements_width', '260'); } catch {}
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
                      try { localStorage.setItem('takeoff_measurements_width', '360'); } catch {}
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

            {/* Quick status bar */}
            {measurements.length > 0 && (
              <div className="px-3 py-1 bg-slate-800/40 border-b border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>{measurements.filter((m) => m.addedToBoq).length} in BOQ</span>
                <span className="font-mono text-slate-500">{panelWidth}px</span>
              </div>
            )}

            {/* Measurements List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {measurements.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Ruler className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs font-bold text-slate-400">No Measurements Yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px] mx-auto">
                  Select a tool above (Length, Area, Wall, Count) and measure directly on the drawing.
                </p>
              </div>
            ) : (
              measurements.map((m) => {
                const isSelected = m.id === selectedMeasurementId;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMeasurementId(m.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-xs'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                          {m.toolType}
                        </span>
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
              })
            )}
          </div>
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
