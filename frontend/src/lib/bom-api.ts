// src/lib/bom-api.ts
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface BOMLine {
  component_id: number;
  qty_per_unit: number;
  waste_pct?: number;
  notes?: string | null;
}

export interface BOMCreate {
  variant_id: number;
  lines: BOMLine[];
}

export interface BOMResponse {
  id: number;
  variant_id: number;
  is_active: boolean;
  version: number;
  lines: (BOMLine & { id: number; bom_id: number; created_at: string })[];
  created_at: string;
  updated_at: string | null;
}

export interface AvailabilityResult {
  can_make_now: number | null;
  bottleneck_component_id: number | null;
  bottleneck_name: string | null;
  message: string;
}

export async function getBOM(variantId: number): Promise<BOMResponse> {
  const response = await fetch(`${API_URL}/api/v1/boms/${variantId}/bom`);
  if (!response.ok) throw new Error('Failed to fetch BOM');
  return response.json();
}

export async function createBOM(variantId: number, data: BOMCreate): Promise<BOMResponse> {
  const response = await fetch(`${API_URL}/api/v1/boms/${variantId}/bom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create BOM');
  return response.json();
}

export async function getAvailability(variantId: number, safetyBuffer = 0): Promise<AvailabilityResult> {
  const response = await fetch(`${API_URL}/api/v1/boms/${variantId}/availability?safety_buffer=${safetyBuffer}`);
  if (!response.ok) throw new Error('Failed to fetch availability');
  return response.json();
}

export interface Component {
  id: number;
  name: string;
  sku: string | null;
  component_type: string;
  unit: string;
  available: number;
  on_hand: number;
  threshold: number;
}

export async function fetchComponentsList(): Promise<Component[]> {
  const response = await fetch(`${API_URL}/api/v1/components`);
  if (!response.ok) throw new Error('Failed to fetch components');
  return response.json();
}