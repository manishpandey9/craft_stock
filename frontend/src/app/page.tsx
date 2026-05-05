// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  IndexTable,
  Badge,
  Button,
  EmptyState,
  Banner,
  InlineGrid,
  InlineStack,
  Spinner,
} from "@shopify/polaris";
import { fetchComponents, Component } from "@/lib/api";
import CreateComponentModal from "@/components/CreateComponentModal";
import BOMEditor from "@/components/BOMEditor";

export default function Home() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{id: number, name: string} | null>(null);
  const [totalCapacity, setTotalCapacity] = useState<number | null>(null);

  useEffect(() => {
    loadComponents();
  }, []);

  // Calculate "Can Make Now" when components load
  useEffect(() => {
    if (components.length > 0 && !loading) {
      calculateCapacity();
    }
  }, [components, loading]);

  async function loadComponents() {
    try {
      setLoading(true);
      const data = await fetchComponents();
      setComponents(data);
      setError(null);
    } catch (err) {
      setError("Failed to load components. Is backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function calculateCapacity() {
    // MVP Logic: Simple MIN of all available stocks
    // Real logic: Query all BOMs + calculate per variant
    if (components.length === 0) {
      setTotalCapacity(0);
      return;
    }

    // Filter active components with stock > 0
    const activeComponents = components.filter(c => c.is_active && c.available > 0);
    
    if (activeComponents.length === 0) {
      setTotalCapacity(0);
      return;
    }

    // Simple simulation: Assume 1 unit of each component per finished product
    // In production: This would iterate through all active BOMs
    const minCapacity = Math.min(...activeComponents.map(c => 
      Math.floor(c.available / 1) // Simplified: 1 component = 1 finished unit
    ));

    setTotalCapacity(minCapacity);
  }

  function getStockStatusBadge(available: number, threshold: number) {
    if (available <= 0) return <Badge tone="critical">Out of Stock</Badge>;
    if (available <= threshold) return <Badge tone="warning">Low Stock</Badge>;
    return <Badge tone="success">In Stock</Badge>;
  }

  const lowStockComponents = components.filter(c => c.available <= c.threshold && c.available > 0);
  const outOfStockComponents = components.filter(c => c.available <= 0);

  const resourceName = { singular: "component", plural: "components" };

  const rowMarkup = components.map((c) => (
    <IndexTable.Row id={c.id.toString()} key={c.id} position={c.id}>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" fontWeight="bold">{c.name}</Text>
        {c.sku && <Text as="span" variant="bodySm" tone="subdued">{c.sku}</Text>}
      </IndexTable.Cell>
      <IndexTable.Cell>{c.component_type}</IndexTable.Cell>
      <IndexTable.Cell>{c.available} {c.unit}</IndexTable.Cell>
      <IndexTable.Cell>{c.on_hand} {c.unit}</IndexTable.Cell>
      <IndexTable.Cell>{c.threshold} {c.unit}</IndexTable.Cell>
      <IndexTable.Cell>{getStockStatusBadge(c.available, c.threshold)}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button 
          size="micro" 
          onClick={() => {
            setSelectedVariant({ id: 1, name: "Test Candle Variant" });
            setBomModalOpen(true);
          }}
        >
          Map BOM
        </Button>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    // src/app/page.tsx - Update Page component
<Page
  title="CraftStock"
  primaryAction={
    <InlineStack gap="200">
      <NotificationBell />
      <Button variant="plain" onClick={() => window.location.href = '/settings'}>
        ⚙️ Settings
      </Button>
      <Button variant="plain" onClick={() => window.location.href = '/risk'}>
  ⚠️ Risk Analysis
</Button>
      <Button variant="primary" onClick={() => setModalOpen(true)}>Add Component</Button>
    </InlineStack>
  }
>
      <Layout>
        <Layout.Section>
          {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Components Overview</Text>
              <Text as="p" variant="bodyMd" tone="subdued">Track raw materials and hidden consumables for your products.</Text>

              <BlockStack gap="300">
                {/* Summary Cards Row */}
                <InlineGrid columns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap="400">
                  
                  {/* Card 1: Can Make Now */}
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="headingSm" tone="subdued">Can Make Now</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {loading ? "…" : totalCapacity !== null ? totalCapacity : "0"}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Based on current stock + BOMs
                      </Text>
                    </BlockStack>
                  </Card>

                  {/* Card 2: Low Stock Items */}
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="headingSm" tone="subdued">Low Stock Alerts</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold" tone={lowStockComponents.length > 0 ? "critical" : "success"}>
                        {lowStockComponents.length}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Items below threshold
                      </Text>
                    </BlockStack>
                  </Card>

                  {/* Card 3: Total Components */}
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="headingSm" tone="subdued">Total Components</Text>
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {components.length}
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Raw materials + packaging
                      </Text>
                    </BlockStack>
                  </Card>
                </InlineGrid>

                {/* Low Stock Banner */}
                {lowStockComponents.length > 0 && (
                  <Banner tone="warning" onDismiss={() => {}}>
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      ⚠️ {lowStockComponents.length} component(s) low on stock
                    </Text>
                    <Text as="p" variant="bodySm">
                      {lowStockComponents.map(c => c.name).join(", ")}
                    </Text>
                  </Banner>
                )}

                {/* Out of Stock Banner */}
                {outOfStockComponents.length > 0 && (
                  <Banner tone="critical" onDismiss={() => {}}>
                    <Text as="p" variant="bodyMd" fontWeight="bold">
                      🚫 {outOfStockComponents.length} component(s) out of stock
                    </Text>
                    <Text as="p" variant="bodySm">
                      {outOfStockComponents.map(c => c.name).join(", ")}
                    </Text>
                  </Banner>
                )}
              </BlockStack>
              
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}><Spinner /></div>
              ) : components.length === 0 ? (
                <EmptyState 
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  heading="No components yet" 
                  action={{ content: "Add component", onAction: () => setModalOpen(true) }}
                >
                  <p>Create your first raw material or packaging item.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={resourceName}
                  itemCount={components.length}
                  headings={[
                    { title: "Name" }, 
                    { title: "Type" }, 
                    { title: "Available" }, 
                    { title: "On Hand" }, 
                    { title: "Threshold" }, 
                    { title: "Status" },
                    { title: "Actions" }
                  ]}
                >
                  {rowMarkup}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      
      <CreateComponentModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={loadComponents} />
      
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
    </Page>
  );
}