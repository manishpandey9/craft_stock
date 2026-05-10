"use client";

import { useEffect, useState } from "react";
import { fetchComponents, deleteComponent, Component } from "@/lib/api";
import CreateComponentModal from "@/components/CreateComponentModal";
import BOMEditor from "@/components/BOMEditor";
import { Spinner } from "@shopify/polaris";

export default function Dashboard() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [componentToEdit, setComponentToEdit] = useState<Component | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{id: number, name: string} | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeBomCount, setActiveBomCount] = useState<number>(0);
  const [totalCapacity, setTotalCapacity] = useState<number | null>(null);

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    setLoading(true);
    try {
      const data = await fetchComponents();
      setComponents(data);
      calculateCapacity();
      
      // Fetch alerts for activity feed
      const { fetchAlerts, fetchBOMCount } = await import("@/lib/api");
      const [recentAlerts, bomCountData] = await Promise.all([
        fetchAlerts(5),
        fetchBOMCount()
      ]);
      setAlerts(recentAlerts);
      setActiveBomCount(bomCountData.count);
    } catch (err) {
      setError("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!componentToDelete) return;
    setIsDeleting(true);
    try {
      await deleteComponent(componentToDelete.id);
      setDeleteModalOpen(false);
      setComponentToDelete(null);
      loadComponents();
    } catch (err) {
      setError("Failed to delete component");
    } finally {
      setIsDeleting(false);
    }
  }

  function calculateCapacity() {
    // MVP Logic: Simple MIN of all available stocks
    // Real logic: Query all BOMs + calculate per variant
    setTotalCapacity(97); // Mock placeholder matching previous state
  }

  const lowStockComponents = components.filter(c => c.available <= c.threshold);
  const outOfStockComponents = components.filter(c => c.available <= 0);

  // Total inventory value calculated dynamically using component cost prices
  const totalValue = components.reduce((acc, c) => acc + (c.available * (c.cost_per_unit || 0)), 0);
  const inventoryValue = `₹${(totalValue / 1000).toFixed(1)}k`;
  
  // Active BOMs is now fetched from backend API
  const activeBoms = activeBomCount;

  return (
    <>
      {/* Dashboard Header */}
      <div className="mb-xl flex justify-between items-end">
        <div>
          <h2 className="font-h1 text-h1 text-primary">Workshop Overview</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">Welcome back. You have {lowStockComponents.length} pending alerts.</p>
        </div>
        <div className="flex gap-sm">
          <button className="px-lg py-sm border border-outline text-primary rounded-xl font-button hover:bg-surface-container transition-all cursor-pointer">
            Generate Report
          </button>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-lg py-sm bg-primary text-on-primary rounded-xl font-button hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            New Component
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-body-md font-bold">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-xl"><Spinner /></div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-2xl">
            {/* KPI 1: Active BOMs */}
            <div className="bg-surface p-lg rounded-xl border border-outline-variant border-l-4 border-l-primary shadow-[0_2px_8px_rgba(17,18,16,0.04)]">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-primary">inventory</span>
                <span className="text-error font-label-md flex items-center gap-xs">-2% <span className="material-symbols-outlined text-[14px]">trending_down</span></span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active BOMs</p>
              <h3 className="font-display text-[32px] font-bold text-on-surface mt-xs">{activeBoms}</h3>
            </div>

            {/* KPI 2: Total Components */}
            <div className="bg-surface p-lg rounded-xl border border-outline-variant border-l-4 border-l-primary shadow-[0_2px_8px_rgba(17,18,16,0.04)]">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-primary">category</span>
                <span className="text-primary font-label-md flex items-center gap-xs">+12% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Components</p>
              <h3 className="font-display text-[32px] font-bold text-on-surface mt-xs">{components.length}</h3>
            </div>

            {/* KPI 3: Low Stock Items */}
            <div className={`bg-surface p-lg rounded-xl border border-outline-variant border-l-4 ${lowStockComponents.length > 0 ? 'border-l-error' : 'border-l-primary'} shadow-[0_2px_8px_rgba(17,18,16,0.04)]`}>
              <div className="flex justify-between items-start mb-sm">
                <span className={`material-symbols-outlined ${lowStockComponents.length > 0 ? 'text-error' : 'text-primary'}`}>warning</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Low Stock Items</p>
              <h3 className="font-display text-[32px] font-bold text-on-surface mt-xs">{lowStockComponents.length < 10 ? `0${lowStockComponents.length}` : lowStockComponents.length}</h3>
            </div>

            {/* KPI 4: Inventory Value */}
            <div className="bg-surface p-lg rounded-xl border border-outline-variant border-l-4 border-l-primary shadow-[0_2px_8px_rgba(17,18,16,0.04)]">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-primary">payments</span>
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Inventory Value</p>
              <h3 className="font-display text-[32px] font-bold text-on-surface mt-xs">{inventoryValue}</h3>
            </div>
          </div>

          {/* Bento Layout for Content */}
          <div className="grid grid-cols-12 gap-lg">
            {/* Left Column: At Risk Tables */}
            <div className="col-span-8 flex flex-col gap-lg">
              
              {/* Components List / At Risk Components */}
              <section className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                  <h3 className="font-h3 text-h3 text-on-surface">Critical Stock Alerts & Components</h3>
                  <a className="text-primary font-label-md flex items-center gap-xs hover:underline cursor-pointer" onClick={() => setModalOpen(true)}>
                    Add Component <span className="material-symbols-outlined text-sm">add</span>
                  </a>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-lowest">
                        <th className="px-lg py-md font-label-md text-on-surface-variant border-b border-outline-variant">Component</th>
                        <th className="px-lg py-md font-label-md text-on-surface-variant border-b border-outline-variant">Type</th>
                        <th className="px-lg py-md font-label-md text-on-surface-variant border-b border-outline-variant">Current Stock</th>
                        <th className="px-lg py-md font-label-md text-on-surface-variant border-b border-outline-variant">Status</th>
                        <th className="px-lg py-md font-label-md text-on-surface-variant border-b border-outline-variant">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-xl text-on-surface-variant">No components found.</td>
                        </tr>
                      ) : (
                        components.map(c => {
                          const isLowStock = c.available <= c.threshold;
                          const isOutOfStock = c.available <= 0;
                          
                          return (
                            <tr key={c.id} className="hover:bg-surface-container-low transition-colors group">
                              <td className="px-lg py-md border-b border-outline-variant">
                                <div className="flex items-center gap-md">
                                  <div className="w-10 h-10 rounded bg-surface-container-high flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">
                                      {c.component_type === 'packaging' ? 'inventory_2' : 'filter_vintage'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-button text-on-surface">{c.name}</p>
                                    <p className="text-[12px] text-on-surface-variant">{c.sku}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-lg py-md border-b border-outline-variant font-body-sm capitalize">{c.component_type.replace('_', ' ')}</td>
                              <td className={`px-lg py-md border-b border-outline-variant font-body-sm font-bold ${isOutOfStock ? 'text-error' : isLowStock ? 'text-tertiary' : 'text-primary'}`}>
                                {c.available} / {c.threshold} {c.unit}
                              </td>
                              <td className="px-lg py-md border-b border-outline-variant">
                                {isOutOfStock ? (
                                  <span className="px-sm py-1 bg-error-container text-on-error-container text-[11px] font-bold rounded-lg uppercase">Critical</span>
                                ) : isLowStock ? (
                                  <span className="px-sm py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold rounded-lg uppercase">Low Stock</span>
                                ) : (
                                  <span className="px-sm py-1 bg-secondary-container text-on-secondary-container text-[11px] font-bold rounded-lg uppercase">In Stock</span>
                                )}
                              </td>
                              <td className="px-lg py-md border-b border-outline-variant">
                                <div className="flex gap-sm transition-opacity">
                                  <button 
                                    onClick={() => { setSelectedVariant({ id: 1, name: "Test Candle Variant" }); setBomModalOpen(true); }}
                                    className="p-1 hover:bg-surface-container-highest rounded text-primary transition-colors cursor-pointer"
                                    title="Map BOM"
                                  >
                                    <span className="material-symbols-outlined text-sm">account_tree</span>
                                  </button>
                                  <button 
                                    onClick={() => { setComponentToEdit(c); setModalOpen(true); }}
                                    className="p-1 hover:bg-surface-container-highest rounded text-primary transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <span className="material-symbols-outlined text-sm">edit</span>
                                  </button>
                                  <button 
                                    onClick={() => { setComponentToDelete(c); setDeleteModalOpen(true); }}
                                    className="p-1 hover:bg-error-container rounded text-error transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* At Risk Products */}
              <section className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
                <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                  <h3 className="font-h3 text-h3 text-on-surface">Production Bottlenecks</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant">
                  {lowStockComponents.slice(0, 2).map((c, i) => (
                    <div key={c.id} className="bg-surface p-lg flex flex-col gap-sm">
                      <div className="flex justify-between items-center">
                        <span className="px-sm py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold rounded-lg uppercase">LOW STOCK</span>
                        <span className="material-symbols-outlined text-tertiary">warning</span>
                      </div>
                      <h4 className="font-h3 text-h3">{c.name}</h4>
                      <p className="font-body-sm text-on-surface-variant">Available: {c.available} {c.unit} (Threshold: {c.threshold})</p>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-md">
                        <div className="bg-tertiary h-full" style={{ width: `${Math.min(100, (c.available / c.threshold) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {lowStockComponents.length === 0 && (
                    <div className="bg-surface p-lg col-span-2 text-center text-on-surface-variant py-xl">
                      No production bottlenecks detected.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Activity Feed */}
            <div className="col-span-4">
              <section className="bg-surface rounded-xl border border-outline-variant h-full flex flex-col">
                <div className="p-lg border-b border-outline-variant bg-surface-container-low">
                  <h3 className="font-h3 text-h3 text-on-surface">Recent Activity</h3>
                </div>
                <div className="p-lg flex-1 overflow-y-auto">
                  <ul className="space-y-lg relative">
                    {/* Vertical line for feed */}
                    <div className="absolute left-5 top-0 bottom-0 w-[1px] bg-outline-variant"></div>
                    
                    {alerts.length === 0 ? (
                      <p className="text-on-surface-variant text-center py-xl pl-10">No recent activity.</p>
                    ) : (
                      alerts.map((alert) => (
                        <li key={alert.id} className="relative flex gap-lg pl-10">
                          <div className={`absolute left-3 top-1 w-4 h-4 rounded-full ring-4 ring-surface ${
                            alert.severity === 'critical' ? 'bg-error' : 
                            alert.severity === 'high' ? 'bg-tertiary' : 'bg-primary'
                          }`}></div>
                          <div>
                            <p className="font-button text-on-surface">{alert.title}</p>
                            <p className="font-body-sm text-on-surface-variant">{alert.message}</p>
                            <p className="text-[11px] text-on-surface-variant font-bold mt-sm uppercase">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="mt-xl p-lg bg-surface-container rounded-xl">
                    <p className="font-label-md text-label-md text-primary mb-sm">PRO TIP</p>
                    <p className="font-body-sm text-on-surface-variant">Automate your Jasmine restock by linking your ScentLabs account in Settings.</p>
                    <button className="mt-md text-primary font-bold text-sm hover:underline cursor-pointer">Link Now</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </>
      )}



      <CreateComponentModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setComponentToEdit(null); }} 
        onSuccess={() => { setComponentToEdit(null); loadComponents(); }} 
        initialData={componentToEdit} 
      />

      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-variant/80 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl shadow-2xl max-w-[28rem] w-full border border-outline-variant overflow-hidden animate-fade-in">
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-error-container">
              <h3 className="font-h3 text-h3 text-on-error-container flex items-center gap-xs">
                <span className="material-symbols-outlined">warning</span> Delete Component?
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-on-error-container hover:bg-surface-variant/20 p-1 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-lg">
              <p className="font-body-md text-on-surface">Are you sure you want to delete <b>{componentToDelete?.name}</b>? This action cannot be undone.</p>
            </div>
            <div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-end gap-sm">
              <button 
                onClick={() => setDeleteModalOpen(false)} 
                className="px-md py-sm rounded-lg font-button text-on-surface-variant hover:bg-surface-container transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="px-md py-sm rounded-lg font-button bg-error text-on-error hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-xs"
                disabled={isDeleting}
              >
                {isDeleting && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {bomModalOpen && selectedVariant && (
        <BOMEditor
          variantId={selectedVariant.id}
          variantName={selectedVariant.name}
          open={bomModalOpen}
          onClose={() => {
            setBomModalOpen(false);
            setSelectedVariant(null);
          }}
          onSuccess={() => {
            setBomModalOpen(false);
            setSelectedVariant(null);
            loadComponents();
          }}
        />
      )}
    </>
  );
}