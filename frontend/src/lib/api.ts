// src/lib/api.ts
const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace('localhost', '127.0.0.1');

export interface Component {
  id: number;
  name: string;
  sku: string | null;
  component_type: 'raw_material' | 'packaging' | 'insert' | 'consumable';
  unit: string;
  on_hand: number;
  reserved: number;
  available: number;
  threshold: number;
  reorder_qty: number | null;
  supplier: string | null;
  lead_time_days: number | null;
  notes: string | null;
  cost_per_unit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export async function fetchComponents(): Promise<Component[]> {
  const response = await fetch(`${API_URL}/api/v1/components`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch components');
  }
  
  return response.json();
}

export async function createComponent(data: Partial<Component>): Promise<Component> {
  const response = await fetch(`${API_URL}/api/v1/components`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create component');
  }
  
  return response.json();
}

export async function updateComponent(id: number, data: Partial<Component>): Promise<Component> {
  const response = await fetch(`${API_URL}/api/v1/components/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update component');
  }
  
  return response.json();
}

export async function deleteComponent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/components/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete component');
  }
}

export async function calculateTotalCapacity(): Promise<number> {
  // For MVP: Simple logic - min of all component-supported units
  // In production: Query all active BOMs + calculate per variant
  const components = await fetchComponents();
  
  if (components.length === 0) return 0;
  
  // Simple simulation: Assume 1 variant using all components
  // Real logic would iterate through all BOMs
  let minCapacity = Infinity;
  
  for (const comp of components) {
    if (comp.available > 0) {
      // Assume 1 unit of component per finished product (simplified)
      const capacity = Math.floor(comp.available / 1);
      if (capacity < minCapacity) minCapacity = capacity;
    }
  }
  
  return minCapacity === Infinity ? 0 : minCapacity;
}

export interface Alert {
  id: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_suggestion' | 'bom_incomplete';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export async function getAlertCount(): Promise<{ count: number }> {
  const response = await fetch(`${API_URL}/api/v1/alerts/count`);
  if (!response.ok) throw new Error('Failed to fetch alert count');
  return response.json();
}

export async function fetchAlerts(limit = 50): Promise<Alert[]> {
  const response = await fetch(`${API_URL}/api/v1/alerts?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch alerts');
  return response.json();
}

export async function markAlertRead(alertId: number): Promise<Alert> {
  const response = await fetch(`${API_URL}/api/v1/alerts/${alertId}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to mark alert as read');
  return response.json();
}

export interface MerchantSettings {
  merchant_id: string;
  default_threshold: number;
  default_reorder_qty: number;
  default_waste_pct: number;
  safety_buffer_enabled: boolean;
  safety_buffer_pct: number;
  operation_mode: 'advisory' | 'mirror';
  auto_deduct_on_order: boolean;
  email_notifications_enabled: boolean;
  email_address: string | null;
  low_stock_email_threshold: number;
  shopify_sync_enabled: boolean;
}

export async function getSettings(): Promise<MerchantSettings> {
  const response = await fetch(`${API_URL}/api/v1/settings`);
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
}

export async function updateSettings( updates: Partial<MerchantSettings>): Promise<MerchantSettings> {
  const response = await fetch(`${API_URL}/api/v1/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update settings');
  return response.json();
}

export interface CSVImportResult {
  success: boolean;
  imported_count: number;
  error_count: number;
  imported: Array<{ row: number; name: string; id: number | null }>;
  errors: Array<{ row: number; error: string; data: any }>;
  error?: string;
}

export async function downloadComponentTemplate(): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/csv/template/components`);
  if (!response.ok) throw new Error('Failed to download template');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'components_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportComponents(): Promise<void> {
  const response = await fetch(`${API_URL}/api/v1/csv/export/components`);
  if (!response.ok) throw new Error('Failed to export components');
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `components_export_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function importComponents(file: File): Promise<CSVImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/api/v1/csv/import/components`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to import components');
  }
  
  return response.json();
}

export async function fetchBOMCount(): Promise<{ count: number }> {
  const response = await fetch(`${API_URL}/api/v1/boms/count`);
  if (!response.ok) throw new Error('Failed to fetch BOM count');
  return response.json();
}
