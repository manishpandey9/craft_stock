// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  FormLayout,
  TextField,
  Checkbox,
  Select,
  Button,
  Banner,
  Spinner,
  InlineGrid,
} from "@shopify/polaris";
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
      <Page title="Settings">
        <div style={{ textAlign: "center", padding: "80px" }}>
          <Spinner accessibilityLabel="Loading settings" />
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      primaryAction={
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Changes
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}
          {saved && (
            <Banner tone="success" onDismiss={() => setSaved(false)}>
              Settings saved successfully!
            </Banner>
          )}

          <BlockStack gap="400">
            {/* Stock Management */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd" fontWeight="bold">
                  Stock Management
                </Text>
                <FormLayout>
                  <TextField
                    label="Default Low Stock Threshold"
                    type="number"
                    value={settings?.default_threshold.toString() || "10"}
                    onChange={(v) => updateField("default_threshold", Number(v))}
                    autoComplete="off"
                    helpText="Alert when stock falls below this value"
                  />
                  <TextField
                    label="Default Reorder Quantity"
                    type="number"
                    value={settings?.default_reorder_qty.toString() || "50"}
                    onChange={(v) => updateField("default_reorder_qty", Number(v))}
                    autoComplete="off"
                    helpText="Suggested quantity when reordering"
                  />
                  <TextField
                    label="Default Waste %"
                    type="number"
                    value={settings?.default_waste_pct.toString() || "0"}
                    onChange={(v) => updateField("default_waste_pct", Number(v))}
                    autoComplete="off"
                    min="0"
                    max="100"
                    suffix="%"
                    helpText="Applied to new BOM lines by default"
                  />
                  <Checkbox
                    label="Enable Safety Buffer"
                    checked={settings?.safety_buffer_enabled || false}
                    onChange={(v) => updateField("safety_buffer_enabled", v)}
                  />
                  {settings?.safety_buffer_enabled && (
                    <TextField
                      label="Safety Buffer %"
                      type="number"
                      value={settings?.safety_buffer_pct.toString() || "5"}
                      onChange={(v) => updateField("safety_buffer_pct", Number(v))}
                      autoComplete="off"
                      min="0"
                      max="50"
                      suffix="%"
                      helpText="Extra buffer subtracted from available stock for calculations"
                    />
                  )}
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Operation Mode */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd" fontWeight="bold">
                  Operation Mode
                </Text>
                <FormLayout>
                  <Select
                    label="Mode"
                    options={[
                      { label: "Advisory (Recommended)", value: "advisory" },
                      {
                        label: "Mirror (Auto-deduct on orders)",
                        value: "mirror",
                      },
                    ]}
                    value={settings?.operation_mode || "advisory"}
                    onChange={(v) =>
                      updateField("operation_mode", v as "advisory" | "mirror")
                    }
                    helpText="Advisory: Manual deduction | Mirror: Auto-deduct on Shopify orders"
                  />
                  <Checkbox
                    label="Auto-deduct on Order (Mirror Mode)"
                    checked={settings?.auto_deduct_on_order || false}
                    onChange={(v) => updateField("auto_deduct_on_order", v)}
                    disabled={settings?.operation_mode !== "mirror"}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Notifications */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd" fontWeight="bold">
                  Notifications
                </Text>
                <FormLayout>
                  <Checkbox
                    label="Enable Email Notifications"
                    checked={settings?.email_notifications_enabled || false}
                    onChange={(v) =>
                      updateField("email_notifications_enabled", v)
                    }
                  />
                  {settings?.email_notifications_enabled && (
                    <>
                      <TextField
                        label="Notification Email"
                        type="email"
                        value={settings?.email_address || ""}
                        onChange={(v) => updateField("email_address", v)}
                        autoComplete="email"
                        placeholder="you@yourstore.com"
                      />
                      <TextField
                        label="Low Stock Email Threshold"
                        type="number"
                        value={settings?.low_stock_email_threshold?.toString() || "20"}
                        onChange={(v) => updateField("low_stock_email_threshold", Number(v))}
                        autoComplete="off"
                        helpText="Send email alert when stock falls below this value"
                      />
                    </>
                  )}
                </FormLayout>
              </BlockStack>
            </Card>

            {/* Shopify Integration */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd" fontWeight="bold">
                  Shopify Integration
                </Text>
                <FormLayout>
                  <Checkbox
                    label="Enable Shopify Sync"
                    checked={settings?.shopify_sync_enabled || false}
                    onChange={(v) => updateField("shopify_sync_enabled", v)}
                  />
                  <Text as="p" variant="bodySm" tone="subdued">
                    When enabled, automatically sync products/variants from your
                    Shopify store.
                  </Text>
                </FormLayout>
              </BlockStack>
            </Card>
            {/* CSV Import/Export */}
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd" fontWeight="bold">Bulk Import/Export</Text>
                <FormLayout>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodyMd">Manage components in bulk using CSV files.</Text>
                    <InlineGrid columns={{ xs: "1fr", sm: "1fr 1fr" }} gap="200">
                      <Button 
                        variant="secondary" 
                        onClick={async () => {
                          try {
                            await import('@/lib/api').then(m => m.downloadComponentTemplate());
                          } catch {}
                        }}
                      >
                        📥 Download Template
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await import('@/lib/api').then(m => m.exportComponents());
                          } catch {}
                        }}
                      >
                        📤 Export Current Data
                      </Button>
                    </InlineGrid>
                    <Button 
                      variant="primary"
                      onClick={() => setImportModalOpen(true)}
                    >
                      📁 Import from CSV
                    </Button>
                  </BlockStack>
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      
      {/* CSV Import Modal */}
      <CSVImportModal 
        open={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onSuccess={() => {
          setImportModalOpen(false);
          // Optional: refresh data if needed
        }} 
      />
    </Page>
  );
}
