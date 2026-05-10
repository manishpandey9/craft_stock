// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings, type MerchantSettings } from "@/lib/api";
import CSVImportModal from "@/components/CSVImportModal";


export default function SettingsPage() {
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError("Failed to load settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof MerchantSettings, value: any) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-32">
        <span className="material-symbols-outlined animate-spin text-[48px] text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="pb-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="font-display text-display text-primary">Settings</h1>
          <p className="font-body-lg text-on-surface-variant">Manage your workshop preferences and integrations.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-xs px-lg py-sm bg-primary text-on-primary rounded-xl font-button hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="mb-lg p-md bg-error-container text-on-error-container rounded-xl flex items-center gap-sm">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="font-body-md flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {saved && (
        <div className="mb-lg p-md bg-primary-container/30 border border-primary-container text-primary rounded-xl flex items-center gap-sm animate-fade-in">
          <span className="material-symbols-outlined">check_circle</span>
          <p className="font-body-md font-bold flex-1">Settings saved successfully!</p>
          <button onClick={() => setSaved(false)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-8 flex flex-col gap-lg">
          
          {/* Stock Management */}
          <section className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
              <h2 className="font-h2 text-h2 text-on-surface">Stock Management</h2>
              <p className="font-body-sm text-on-surface-variant mt-xs">Configure default thresholds, reorder quantities, and safety buffers for your inventory calculations.</p>
            </div>
            <div className="p-lg flex flex-col gap-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Default Low Stock Threshold</label>
                  <input
                    type="number"
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={settings?.default_threshold || ""}
                    onChange={(e) => updateField("default_threshold", Number(e.target.value))}
                  />
                  <span className="font-body-sm text-on-surface-variant">Alert when stock falls below this value</span>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Default Reorder Quantity</label>
                  <input
                    type="number"
                    className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={settings?.default_reorder_qty || ""}
                    onChange={(e) => updateField("default_reorder_qty", Number(e.target.value))}
                  />
                  <span className="font-body-sm text-on-surface-variant">Suggested quantity when reordering</span>
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">Default Waste %</label>
                <div className="flex items-center gap-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-32 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    value={settings?.default_waste_pct || ""}
                    onChange={(e) => updateField("default_waste_pct", Number(e.target.value))}
                  />
                  <span className="font-body-md text-on-surface-variant">%</span>
                </div>
                <span className="font-body-sm text-on-surface-variant">Applied to new BOM lines by default</span>
              </div>

              <div className="border-t border-outline-variant pt-md mt-sm flex flex-col gap-sm">
                <label className="flex items-center gap-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    checked={settings?.safety_buffer_enabled || false}
                    onChange={(e) => updateField("safety_buffer_enabled", e.target.checked)}
                  />
                  <span className="font-button text-on-surface">Enable Safety Buffer</span>
                </label>
                
                {settings?.safety_buffer_enabled && (
                  <div className="flex flex-col gap-xs ml-8">
                    <label className="font-label-md text-label-md text-on-surface">Safety Buffer %</label>
                    <div className="flex items-center gap-sm">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        className="w-32 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={settings?.safety_buffer_pct || ""}
                        onChange={(e) => updateField("safety_buffer_pct", Number(e.target.value))}
                      />
                      <span className="font-body-md text-on-surface-variant">%</span>
                    </div>
                    <span className="font-body-sm text-on-surface-variant">Extra buffer subtracted from available stock for calculations</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Operation Mode */}
          <section className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
              <h2 className="font-h2 text-h2 text-on-surface">Operation Mode</h2>
              <p className="font-body-sm text-on-surface-variant mt-xs">Choose how inventory deductions are handled when Shopify orders are placed.</p>
            </div>
            <div className="p-lg flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface">Mode</label>
                <select
                  className="w-full md:w-1/2 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                  value={settings?.operation_mode || "advisory"}
                  onChange={(e) => updateField("operation_mode", e.target.value)}
                >
                  <option value="advisory">Advisory (Recommended)</option>
                  <option value="mirror">Mirror (Auto-deduct on orders)</option>
                </select>
                <span className="font-body-sm text-on-surface-variant">Advisory: Manual deduction | Mirror: Auto-deduct on Shopify orders</span>
              </div>

              <label className={`flex items-center gap-sm cursor-pointer mt-sm ${settings?.operation_mode !== "mirror" ? "opacity-50 pointer-events-none" : ""}`}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={settings?.auto_deduct_on_order || false}
                  onChange={(e) => updateField("auto_deduct_on_order", e.target.checked)}
                  disabled={settings?.operation_mode !== "mirror"}
                />
                <span className="font-button text-on-surface">Auto-deduct on Order (Mirror Mode)</span>
              </label>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant bg-surface-container-lowest">
              <h2 className="font-h2 text-h2 text-on-surface">Notifications</h2>
              <p className="font-body-sm text-on-surface-variant mt-xs">Set up email alerts for low stock components.</p>
            </div>
            <div className="p-lg flex flex-col gap-md">
              <label className="flex items-center gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={settings?.email_notifications_enabled || false}
                  onChange={(e) => updateField("email_notifications_enabled", e.target.checked)}
                />
                <span className="font-button text-on-surface">Enable Email Notifications</span>
              </label>
              
              {settings?.email_notifications_enabled && (
                <div className="flex flex-col gap-md ml-8 mt-sm">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Notification Email</label>
                    <input
                      type="email"
                      className="w-full md:w-2/3 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={settings?.email_address || ""}
                      onChange={(e) => updateField("email_address", e.target.value)}
                      placeholder="you@yourstore.com"
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Low Stock Email Threshold</label>
                    <input
                      type="number"
                      className="w-full md:w-1/3 px-md py-sm bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      value={settings?.low_stock_email_threshold || ""}
                      onChange={(e) => updateField("low_stock_email_threshold", Number(e.target.value))}
                    />
                    <span className="font-body-sm text-on-surface-variant">Send email alert when stock falls below this value</span>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Integrations & Bulk */}
        <div className="lg:col-span-4 flex flex-col gap-lg">
          
          {/* Shopify Integration */}
          <section className="bg-surface rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant bg-surface-container-lowest flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-2xl">storefront</span>
              <h2 className="font-h3 text-h3 text-on-surface">Shopify Sync</h2>
            </div>
            <div className="p-lg flex flex-col gap-sm">
              <p className="font-body-md text-on-surface-variant">Manage synchronization between CraftStock and your Shopify store.</p>
              <label className="flex items-center gap-sm cursor-pointer mt-sm p-sm bg-surface-container-lowest border border-outline-variant rounded-lg">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                  checked={settings?.shopify_sync_enabled || false}
                  onChange={(e) => updateField("shopify_sync_enabled", e.target.checked)}
                />
                <span className="font-button text-on-surface">Enable Shopify Sync</span>
              </label>
              <p className="font-body-sm text-on-surface-variant italic">When enabled, automatically sync products/variants from your Shopify store.</p>
            </div>
          </section>

          {/* Bulk Operations */}
          <section className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
            <div className="p-lg border-b border-outline-variant">
              <h2 className="font-h3 text-h3 text-on-surface">Bulk Operations</h2>
              <p className="font-body-sm text-on-surface-variant mt-xs">Import new components or export your current inventory data.</p>
            </div>
            <div className="p-lg flex flex-col gap-md">
              <button 
                onClick={() => setImportModalOpen(true)}
                className="w-full flex items-center justify-center gap-xs px-md py-sm bg-primary-container text-on-primary-container rounded-xl font-button hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">upload</span>
                Import from CSV
              </button>
              
              <div className="grid grid-cols-2 gap-sm">
                <button 
                  onClick={async () => {
                    try {
                      await import('@/lib/api').then(m => m.downloadComponentTemplate());
                    } catch {}
                  }}
                  className="flex items-center justify-center gap-xs px-sm py-sm border border-outline-variant bg-surface text-primary rounded-xl font-button hover:bg-surface-container-lowest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Template
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await import('@/lib/api').then(m => m.exportComponents());
                    } catch {}
                  }}
                  className="flex items-center justify-center gap-xs px-sm py-sm border border-outline-variant bg-surface text-primary rounded-xl font-button hover:bg-surface-container-lowest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">file_export</span>
                  Export
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
      
      {/* CSV Import Modal */}
      <CSVImportModal 
        open={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onSuccess={() => {
          setImportModalOpen(false);
          // Optional: refresh data if needed
        }} 
      />
    </div>
  );
}
