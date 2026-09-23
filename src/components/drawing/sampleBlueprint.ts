/**
 * Let's Estimate - Calibrated Sample Architectural Blueprint Generator
 * Generates an authentic, high-resolution Nigerian architectural floor plan on an HTML5 canvas.
 * Calibrated to standard 1:100 scale (1 meter = 37.79 pixels at 96 DPI).
 * Used as the default initial takeoff plan and resilient fallback if uploaded images/drawings fail to load.
 */

export interface SampleBlueprintResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  scaleRatio: number;
  pixelsPerMeter: number;
}

export function generateSampleArchitecturalPlan(): SampleBlueprintResult {
  const width = 2200;
  const height = 1500;
  const scaleRatio = 100; // 1:100
  const pixelsPerMeter = 37.79; // Standard 96 DPI calibration

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { canvas, width, height, scaleRatio, pixelsPerMeter };
  }

  // 1. Crisp White Drawing Sheet with subtle grid
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border / paper edge
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Drawing Sheet Border (A1 margin)
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 4;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  // Subtle CAD Background Grid (50px / ~1.32m intervals)
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
  ctx.lineWidth = 1;
  for (let x = 80; x < width - 80; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 80);
    ctx.lineTo(x, height - 80);
    ctx.stroke();
  }
  for (let y = 80; y < height - 80; y += 50) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(width - 80, y);
    ctx.stroke();
  }

  // Structural Grid Lines (Red dashed)
  const gridX = [
    { label: 'A', x: 260 },
    { label: 'B', x: 620 },
    { label: 'C', x: 1020 },
    { label: 'D', x: 1420 },
    { label: 'E', x: 1780 },
  ];

  const gridY = [
    { label: '1', y: 220 },
    { label: '2', y: 560 },
    { label: '3', y: 920 },
    { label: '4', y: 1220 },
  ];

  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = 1.5;

  gridX.forEach((g) => {
    ctx.beginPath();
    ctx.moveTo(g.x, 150);
    ctx.lineTo(g.x, 1300);
    ctx.stroke();
  });

  gridY.forEach((g) => {
    ctx.beginPath();
    ctx.moveTo(180, g.y);
    ctx.lineTo(1850, g.y);
    ctx.stroke();
  });
  ctx.restore();

  // Grid Bubbles
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  gridX.forEach((g) => {
    [130, 1320].forEach((yPos) => {
      ctx.beginPath();
      ctx.arc(g.x, yPos, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillText(g.label, g.x, yPos + 1);
    });
  });

  gridY.forEach((g) => {
    [160, 1870].forEach((xPos) => {
      ctx.beginPath();
      ctx.arc(xPos, g.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.fillText(g.label, xPos, g.y + 1);
    });
  });

  // 2. Main Building Outer Walls (225mm Sandcrete Hollow Block)
  // Outer perimeter polygon: (260, 220) to (1780, 1220)
  const wallThickness = 14; // ~225mm at 1:100 scale
  const innerWallThick = 9; // ~150mm partition wall

  // Outer walls fill
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // External envelope rooms
  const rooms = [
    { name: 'FRONT PORCH', x: 260, y: 560, w: 360, h: 180, code: '6.5 m²', use: 'Entrance' },
    { name: 'LIVING ROOM / LOUNGE', x: 620, y: 220, w: 400, h: 520, code: '31.2 m²', use: 'Main Hall' },
    { name: 'DINING AREA', x: 1020, y: 220, w: 400, h: 340, code: '13.6 m²', use: 'Dining' },
    { name: 'KITCHEN & PANTRY', x: 1420, y: 220, w: 360, h: 340, code: '15.3 m²', use: 'Service' },
    { name: 'ANTE ROOM', x: 260, y: 740, w: 360, h: 180, code: '6.5 m²', use: 'Foyer' },
    { name: 'GUEST BEDROOM (ENSUITE)', x: 260, y: 920, w: 360, h: 300, code: '16.2 m²', use: 'Bedroom 3' },
    { name: 'FAMILY LOUNGE', x: 620, y: 740, w: 400, h: 480, code: '24.0 m²', use: 'Circulation' },
    { name: 'BEDROOM 2', x: 1020, y: 560, w: 400, h: 360, code: '16.0 m²', use: 'Bedroom 2' },
    { name: 'MASTER BEDROOM (ENSUITE)', x: 1420, y: 560, w: 360, h: 460, code: '24.8 m²', use: 'Master Bed' },
    { name: 'WALK-IN CLOSET & BATH', x: 1420, y: 1020, w: 360, h: 200, code: '10.8 m²', use: 'Bath/WC' },
    { name: 'SHARED BATHROOM & WC', x: 1020, y: 920, w: 200, h: 300, code: '6.0 m²', use: 'Ablution' },
    { name: 'VISITORS CLOAKROOM', x: 1220, y: 920, w: 200, h: 300, code: '6.0 m²', use: 'WC' },
  ];

  // Draw room background fills
  rooms.forEach((r) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });

  // Draw Outer Perimeter Walls (Double line for wall thickness)
  const drawWallSegment = (x1: number, y1: number, x2: number, y2: number, thick: number) => {
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Subtle hatch centerline
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  // Outer Envelope Walls
  drawWallSegment(260, 220, 1780, 220, wallThickness);
  drawWallSegment(1780, 220, 1780, 1220, wallThickness);
  drawWallSegment(1780, 1220, 260, 1220, wallThickness);
  drawWallSegment(260, 1220, 260, 220, wallThickness);

  // Internal Cross Walls
  drawWallSegment(620, 220, 620, 1220, wallThickness);
  drawWallSegment(1020, 220, 1020, 1220, innerWallThick);
  drawWallSegment(1420, 220, 1420, 1220, innerWallThick);
  drawWallSegment(260, 560, 620, 560, innerWallThick);
  drawWallSegment(260, 740, 620, 740, innerWallThick);
  drawWallSegment(260, 920, 620, 920, innerWallThick);
  drawWallSegment(620, 740, 1020, 740, innerWallThick);
  drawWallSegment(1020, 560, 1780, 560, innerWallThick);
  drawWallSegment(1020, 920, 1780, 920, innerWallThick);
  drawWallSegment(1420, 1020, 1780, 1020, innerWallThick);
  drawWallSegment(1220, 920, 1220, 1220, innerWallThick);

  // Structural Columns at Key Intersections (Solid black squares)
  const columns = [
    { x: 260, y: 220 }, { x: 620, y: 220 }, { x: 1020, y: 220 }, { x: 1420, y: 220 }, { x: 1780, y: 220 },
    { x: 260, y: 560 }, { x: 620, y: 560 }, { x: 1020, y: 560 }, { x: 1420, y: 560 }, { x: 1780, y: 560 },
    { x: 260, y: 920 }, { x: 620, y: 920 }, { x: 1020, y: 920 }, { x: 1420, y: 920 }, { x: 1780, y: 920 },
    { x: 260, y: 1220 }, { x: 620, y: 1220 }, { x: 1020, y: 1220 }, { x: 1420, y: 1220 }, { x: 1780, y: 1220 },
  ];

  ctx.fillStyle = '#0f172a';
  columns.forEach((col) => {
    ctx.fillRect(col.x - 10, col.y - 10, 20, 20);
  });

  // Doors with Swing Arcs (Blue symbols)
  const doors = [
    { x: 620, y: 580, r: 35, start: -0.5 * Math.PI, end: 0, tag: 'D1' },
    { x: 620, y: 780, r: 35, start: 0, end: 0.5 * Math.PI, tag: 'D1' },
    { x: 1020, y: 380, r: 35, start: Math.PI, end: 1.5 * Math.PI, tag: 'D2' },
    { x: 1420, y: 380, r: 35, start: 0.5 * Math.PI, end: Math.PI, tag: 'D2' },
    { x: 1020, y: 720, r: 35, start: -0.5 * Math.PI, end: 0, tag: 'D2' },
    { x: 1420, y: 720, r: 35, start: Math.PI, end: 1.5 * Math.PI, tag: 'D1' },
    { x: 620, y: 960, r: 35, start: 0, end: 0.5 * Math.PI, tag: 'D2' },
  ];

  doors.forEach((d) => {
    ctx.save();
    // Clear wall gap for door
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(d.x - 6, d.y - 4, 12, 40);

    // Door leaf
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x, d.y + d.r);
    ctx.stroke();

    // Door swing arc
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, d.start, d.end);
    ctx.stroke();

    // Label
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0369a1';
    ctx.fillText(d.tag, d.x + 12, d.y + 20);
    ctx.restore();
  });

  // Windows (Green symbols on outer walls)
  const windows = [
    { x: 380, y: 220, w: 100, tag: 'W1' },
    { x: 780, y: 220, w: 120, tag: 'W1' },
    { x: 1200, y: 220, w: 100, tag: 'W1' },
    { x: 1560, y: 220, w: 80, tag: 'W2' },
    { x: 1780, y: 400, w: 90, tag: 'W2' },
    { x: 1780, y: 760, w: 120, tag: 'W1' },
    { x: 1780, y: 1100, w: 60, tag: 'W3' },
    { x: 1540, y: 1220, w: 80, tag: 'W2' },
    { x: 1140, y: 1220, w: 80, tag: 'W2' },
    { x: 780, y: 1220, w: 120, tag: 'W1' },
    { x: 380, y: 1220, w: 100, tag: 'W1' },
    { x: 260, y: 1040, w: 100, tag: 'W1' },
  ];

  windows.forEach((win) => {
    ctx.save();
    const isVertical = win.x === 260 || win.x === 1780;
    if (isVertical) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(win.x - 8, win.y - win.w / 2, 16, win.w);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.strokeRect(win.x - 6, win.y - win.w / 2, 12, win.w);
      ctx.beginPath();
      ctx.moveTo(win.x, win.y - win.w / 2);
      ctx.lineTo(win.x, win.y + win.w / 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(win.x - win.w / 2, win.y - 8, win.w, 16);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.strokeRect(win.x - win.w / 2, win.y - 6, win.w, 12);
      ctx.beginPath();
      ctx.moveTo(win.x - win.w / 2, win.y);
      ctx.lineTo(win.x + win.w / 2, win.y);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Room Labels & Area Callouts
  rooms.forEach((r) => {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.name, cx, cy - 10);

    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText(r.code, cx, cy + 12);
  });

  // 3. Exterior Dimensions Chains (Dimension lines with 45-degree ticks)
  const drawDimLine = (x1: number, y1: number, x2: number, y2: number, text: string) => {
    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 45 deg tick marks
    const tickLen = 8;
    [ [x1, y1], [x2, y2] ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - tickLen, y + tickLen);
      ctx.lineTo(x + tickLen, y - tickLen);
      ctx.stroke();
    });

    // Dimension text
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(mx - 32, my - 10, 64, 20);
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#b91c1c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mx, my);
    ctx.restore();
  };

  // Top Dimension Strings
  drawDimLine(260, 180, 620, 180, '3,600');
  drawDimLine(620, 180, 1020, 180, '4,000');
  drawDimLine(1020, 180, 1420, 180, '4,000');
  drawDimLine(1420, 180, 1780, 180, '3,600');
  drawDimLine(260, 120, 1780, 120, '15,200 OVERALL');

  // Left Dimension Strings
  drawDimLine(200, 220, 200, 560, '3,400');
  drawDimLine(200, 560, 200, 920, '3,600');
  drawDimLine(200, 920, 200, 1220, '3,000');
  drawDimLine(140, 220, 140, 1220, '10,000 OVERALL');

  // 4. NIQS Standard Title Block (Bottom Right)
  const tbX = 1400;
  const tbY = 1260;
  const tbW = 460;
  const tbH = 170;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tbX, tbY, tbW, tbH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.strokeRect(tbX, tbY, tbW, tbH);

  // Inner lines
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tbX, tbY + 45);
  ctx.lineTo(tbX + tbW, tbY + 45);
  ctx.moveTo(tbX, tbY + 90);
  ctx.lineTo(tbX + tbW, tbY + 90);
  ctx.moveTo(tbX, tbY + 130);
  ctx.lineTo(tbX + tbW, tbY + 130);
  ctx.moveTo(tbX + 230, tbY + 90);
  ctx.lineTo(tbX + 230, tbY + tbH);
  ctx.stroke();

  // Title block typography
  ctx.fillStyle = '#065f46';
  ctx.font = 'black 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NIGERIAN INSTITUTE OF QUANTITY SURVEYORS (NIQS)', tbX + 16, tbY + 26);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('PROJECT: 3-BEDROOM EXECUTIVE BUNGALOW', tbX + 16, tbY + 68);

  ctx.font = 'normal 11px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('SHEET TITLE:', tbX + 16, tbY + 106);
  ctx.fillText('SCALE:', tbX + 246, tbY + 106);
  ctx.fillText('DRAWING NO:', tbX + 16, tbY + 146);
  ctx.fillText('STANDARD:', tbX + 246, tbY + 146);

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('GROUND FLOOR PLAN', tbX + 16, tbY + 120);
  ctx.fillText('1:100 @ A1', tbX + 246, tbY + 120);
  ctx.fillText('ARC / RES / 01', tbX + 16, tbY + 160);
  ctx.fillText('BESMM4 / NIQS', tbX + 246, tbY + 160);

  // 5. Stylized North Arrow (Top Right)
  const naX = 1820;
  const naY = 100;
  ctx.save();
  ctx.beginPath();
  ctx.arc(naX, naY, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Arrow
  ctx.beginPath();
  ctx.moveTo(naX, naY - 22);
  ctx.lineTo(naX + 10, naY + 14);
  ctx.lineTo(naX, naY + 6);
  ctx.lineTo(naX - 10, naY + 14);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.fillText('N', naX, naY - 26);
  ctx.restore();

  return {
    canvas,
    width,
    height,
    scaleRatio,
    pixelsPerMeter,
  };
}
