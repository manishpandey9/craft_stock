// src/components/BOMEditor.tsx
"use client";

import { useState, useEffect } from "react";
import { createBOM, getAvailability, fetchComponentsList, type BOMLine, type AvailabilityResult } from "@/lib/bom-api";

interface Props {
  variantId: number;
  variantName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// UI state uses string for component_id to match Polaris Select
interface BOMLineUI {
  component_id: string;
  qty_per_unit: number;
  waste_pct: number;
  notes: string | null;
  componentName: string;
  componentUnit: string;
  componentAvailable: number;
}

interface ComponentOption {
  id: number;
  name: string;
  unit: string;
  available: number;
}

export default function BOMEditor({ variantId, variantName, open, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [lines, setLines] = useState<BOMLineUI[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadComponents();
      setLines([]); // Reset on open
      setAvailability(null);
    }
  }, [open]);

  // Recalculate only when lines actually have selected components
  useEffect(() => {
    const validLines = lines.filter(l => l.component_id !== "");
    if (validLines.length > 0) {
      calculateAvailability();
    } else {
      setAvailability(null);
    }
  }, [lines]);

  async function loadComponents() {
    try {
      const data = await fetchComponentsList();
      setComponents(data);
    } catch (err) {
      console.error("Failed to load components", err);
    }
  }

  async function calculateAvailability() {
    try {
      const result = await getAvailability(variantId);
      setAvailability(result);
    } catch {
      setAvailability(null);
    }
  }

  function addLine() {
    setLines([...lines, {
      component_id: "",
      qty_per_unit: 1,
      waste_pct: 0,
      notes: null,
      componentName: "",
      componentUnit: "piece",
      componentAvailable: 0
    }]);
  }

  function updateLine(index: number, field: keyof BOMLineUI, value: any) {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === "component_id") {
      const selected = components.find(c => c.id.toString() === value);
      if (selected) {
        newLines[index].componentName = selected.name;
        newLines[index].componentUnit = selected.unit;
        newLines[index].componentAvailable = selected.available;
      }
    }
    
    setLines(newLines);
  }

  function removeLine(index: number) {
    setLines(lines.filter((_, i) => i !== index));
  }

  async function handleSave() {
    // Convert UI state (string) to API payload (number)
    const validLines = lines
      .filter(line => line.component_id !== "" && line.qty_per_unit > 0)
      .map(line => ({
        component_id: Number(line.component_id),
        qty_per_unit: line.qty_per_unit,
        waste_pct: line.waste_pct || 0,
        notes: line.notes
      }));

    if (validLines.length === 0) {
      setError("Please select at least one component with quantity > 0");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createBOM(variantId, { variant_id: variantId, lines: validLines });
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to save BOM. Check backend console.");
    } finally {
      setLoading(false);
    }
  }

  const componentOptions = components.map(c => ({
    label: `${c.name} (${c.available} ${c.unit} available)`,
    value: c.id.toString()
  }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-variant/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-[56rem] w-full border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="font-h3 text-h3 text-on-surface">
            Edit BOM: <span className="text-primary">{variantName}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-lg overflow-y-auto flex-1 flex { flex-col gap-lg }">
          {error && (
            <div className="p-md bg-error-container text-on-error-container rounded-xl flex items-center gap-sm">
              <span className="material-symbols-outlined">error</span>
              <p className="font-body-md">{error}</p>
              <button className="ml-auto" onClick={() => setError(null)}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {availability && (
            <div className="p-md bg-primary-container/20 border border-primary-container text-on-surface rounded-xl flex flex-col gap-xs">
              <p className="font-h3 text-h3">Can make now: <span className="text-primary">{availability.can_make_now} units</span></p>
              {availability.bottleneck_name && (
                <p className="font-body-sm text-on-surface-variant flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm text-error">warning</span>
                  Bottleneck: {availability.bottleneck_name}
                </p>
              )}
            </div>
          )}

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_50px] gap-md p-md bg-surface-container-low border-b border-outline-variant font-label-md text-label-md text-on-surface-variant">
              <span>Component</span>
              <span>Qty/Unit</span>
              <span>Waste %</span>
              <span>Available</span>
              <span></span>
            </div>

            <div className="flex flex-col p-md gap-sm">
              {lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[2fr_1fr_1fr_1fr_50px] gap-md items-center">
                  <select
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                    value={line.component_id}
                    onChange={(e) => updateLine(index, "component_id", e.target.value)}
                  >
                    <option value="" disabled>Select component</option>
                    {componentOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={line.qty_per_unit}
                    onChange={(e) => updateLine(index, "qty_per_unit", Number(e.target.value))}
                  />

                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full pl-md pr-lg py-sm bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={line.waste_pct}
                      onChange={(e) => updateLine(index, "waste_pct", Number(e.target.value))}
                    />
                    <span className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant">%</span>
                  </div>

                  <div>
                    {line.component_id !== "" ? (
                      line.componentAvailable > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-surface-container-highest text-on-surface font-label-md text-label-md whitespace-nowrap">
                          {line.componentAvailable} {line.componentUnit}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded bg-error-container text-on-error-container font-label-md text-label-md whitespace-nowrap">
                          Out of stock
                        </span>
                      )
                    ) : (
                      <span className="text-on-surface-variant">—</span>
                    )}
                  </div>

                  <button 
                    onClick={() => removeLine(index)}
                    className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}

              <button 
                onClick={addLine}
                className="mt-sm flex items-center justify-center gap-xs py-sm border border-dashed border-outline text-primary rounded-lg font-button hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Component
              </button>
            </div>
            
            {lines.length === 0 && (
              <div className="flex flex-col items-center justify-center p-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-display mb-sm opacity-50">inventory_2</span>
                <p className="font-body-md text-on-surface">No components added yet.</p>
                <p className="font-body-sm">Click "Add Component" to start mapping.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-end gap-sm">
          <button 
            onClick={onClose} 
            className="px-md py-sm rounded-xl font-button text-on-surface-variant hover:bg-surface-container transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-lg py-sm rounded-xl font-button bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
            disabled={loading || lines.length === 0}
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            {loading ? "Saving..." : "Save BOM"}
          </button>
        </div>

      </div>
    </div>
  );
}