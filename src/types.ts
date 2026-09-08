/**
 * Let's Estimate - TypeScript Interfaces
 */

export interface BoqItem {
  id: string;
  project_id?: string;
  item_number: number;
  item: string;          // Walls, RC Slab, Blockwork, Doors, Windows, Roofing, etc.
  description: string;   // Technical specification
  unit: string;          // m2, m3, No, m, kg
  qty: number;           // Quantity
  rate: number;          // Unit rate in Nigerian Naira (₦)
  amount: number;        // Calculated: qty * rate
}

export interface Project {
  id: string;
  title: string;
  location: string;
  client_name: string;
  drawing_filename: string;
  drawing_url?: string;
  created_at?: string;
  updated_at?: string;
  po_percent: number;             // Default 15% Profit & Overheads
  vat_percent: number;            // Default 7.5% Nigerian VAT
  swamp_premium_percent: number;  // Terrain multiplier e.g. Niger Delta swamp premium %
  subtotal: number;
  po_amount: number;
  vat_amount: number;
  grand_total: number;
  notes?: string;
  items: BoqItem[];
}

export interface StandardRate {
  category: string;
  item: string;
  unit: string;
  lagos: number;
  abuja: number;
  ph: number;
  spec: string;
}

export interface TakeoffResponse {
  success: boolean;
  filename: string;
  engineUsed: 'gemini-2.5-flash' | 'intelligent-nigerian-benchmark';
  provider: string;
  drawingSummary?: string;
  items: Array<{
    item: string;
    description: string;
    unit: string;
    qty: number;
    rate?: number;
  }>;
  error?: string;
}
