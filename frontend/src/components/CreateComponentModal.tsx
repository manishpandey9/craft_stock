import React, { useState, useCallback, useEffect } from 'react';
import { createComponent, updateComponent, Component } from '@/lib/api';

interface CreateComponentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Component | null;
}

export default function CreateComponentModal({ open, onClose, onSuccess, initialData }: CreateComponentModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [componentType, setComponentType] = useState('raw_material');
  const [unit, setUnit] = useState('pcs');
  const [threshold, setThreshold] = useState('10');
  const [onHand, setOnHand] = useState('0');
  const [cost, setCost] = useState('0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || '');
      setSku(initialData.sku || '');
      setComponentType(initialData.component_type || 'raw_material');
      setUnit(initialData.unit || 'pcs');
      setThreshold(initialData.threshold?.toString() || '10');
      setOnHand(initialData.on_hand?.toString() || '0');
      setCost(initialData.cost_per_unit?.toString() || '0');
    } else if (open && !initialData) {
      setName('');
      setSku('');
      setComponentType('raw_material');
      setUnit('pcs');
      setThreshold('10');
      setOnHand('0');
      setCost('0');
    }
  }, [open, initialData]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async (event?: any) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    setLoading(true);
    try {
      const onHandVal = parseInt(onHand, 10) || 0;
      const thresholdVal = parseInt(threshold, 10) || 0;

      const payload = {
        name,
        sku,
        component_type: componentType as any,
        unit,
        threshold: thresholdVal,
        on_hand: onHandVal,
        cost_per_unit: parseFloat(cost) || 0,
      };

      if (initialData?.id) {
        await updateComponent(initialData.id, {
          ...payload,
          available: onHandVal - (initialData.reserved || 0)
        });
      } else {
        await createComponent({
          ...payload,
          available: onHandVal,
          reserved: 0,
        });
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to save component:', error);
    } finally {
      setLoading(false);
    }
  }, [name, sku, componentType, unit, threshold, onHand, cost, initialData, onSuccess, handleClose]);

  const componentTypeOptions = [
    { label: 'Raw Material', value: 'raw_material' },
    { label: 'Packaging', value: 'packaging' },
    { label: 'Insert', value: 'insert' },
    { label: 'Consumable', value: 'consumable' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-variant/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-[32rem] w-full border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="font-h3 text-h3 text-on-surface">
            {initialData ? "Edit component" : "Add new component"}
          </h3>
          <button 
            onClick={handleClose} 
            className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-lg overflow-y-auto flex-1">
          <form id="component-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
            
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface">Component Name</label>
              <input
                required
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Glass Jar 8oz"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface">SKU</label>
              <input
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Optional: Stock Keeping Unit"
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface">Component Type</label>
              <select
                className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
              >
                {componentTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">Unit</label>
                <input
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g., pcs, kg, m"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">Threshold</label>
                <input
                  type="number"
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="Low stock alert level"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">On Hand</label>
                <input
                  type="number"
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={onHand}
                  onChange={(e) => setOnHand(e.target.value)}
                  placeholder="Physical stock"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">Cost per Unit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="e.g. 150"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-end gap-sm">
          <button 
            type="button"
            onClick={handleClose} 
            className="px-md py-sm rounded-xl font-button text-on-surface-variant hover:bg-surface-container transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="component-form"
            className="px-lg py-sm rounded-xl font-button bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
            disabled={loading}
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

      </div>
    </div>
  );
}