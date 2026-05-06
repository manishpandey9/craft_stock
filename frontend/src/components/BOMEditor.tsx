// src/components/BOMEditor.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  FormLayout,
  TextField,
  Select,
  Button,
  Card,
  BlockStack,
  Text,
  InlineGrid,
  Badge,
  Banner,
} from "@shopify/polaris";
import { createBOM, getAvailability, type BOMLine, type AvailabilityResult } from "@/lib/bom-api";

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/components`);
      if (response.ok) {
        const data = await response.json();
        setComponents(data);
      }
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit BOM: ${variantName}`}
      size="large"
      primaryAction={{
        content: 'Save BOM',
        onAction: handleSave,
        loading: loading,
        disabled: lines.length === 0,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {error && <Banner tone="critical" onDismiss={() => setError(null)}>{error}</Banner>}

          {availability && (
            <Banner tone="info">
              <Text as="p" variant="bodyMd" fontWeight="bold">Can make now: {availability.can_make_now} units</Text>
              {availability.bottleneck_name && <Text as="p" variant="bodySm">Bottleneck: {availability.bottleneck_name}</Text>}
            </Banner>
          )}

          <Card>
            <BlockStack gap="300">
              <InlineGrid columns="2fr 1fr 1fr 1fr 50px">
                <Text as="span" variant="headingSm">Component</Text>
                <Text as="span" variant="headingSm">Qty/Unit</Text>
                <Text as="span" variant="headingSm">Waste %</Text>
                <Text as="span" variant="headingSm">Available</Text>
                <Text as="span" variant="headingSm">{" "}</Text>
              </InlineGrid>

              {lines.map((line, index) => (
                <InlineGrid key={index} columns="2fr 1fr 1fr 1fr 50px" gap="200">
                  <Select
                    id={`component-${index}`}
                    label="Component"
                    labelHidden
                    options={componentOptions}
                    value={line.component_id}
                    onChange={(val) => updateLine(index, "component_id", val)}
                    placeholder="Select component"
                  />
                  <TextField
                    type="number"
                    label="Qty"
                    labelHidden
                    autoComplete="off"
                    value={line.qty_per_unit.toString()}
                    onChange={(val) => updateLine(index, "qty_per_unit", Number(val))}
                    min={0}
                    step={0.01}
                  />
                  <TextField
                    type="number"
                    label="Waste"
                    labelHidden
                    autoComplete="off"
                    value={line.waste_pct.toString()}
                    onChange={(val) => updateLine(index, "waste_pct", Number(val))}
                    min={0}
                    max={100}
                    suffix="%"
                  />
                  <div style={{ padding: "8px 0" }}>
                    {line.component_id !== "" ? (
                      line.componentAvailable > 0 ? (
                        <Badge tone="success">{`${line.componentAvailable} ${line.componentUnit}`}</Badge>
                      ) : (
                        <Badge tone="critical">Out of stock</Badge>
                      )
                    ) : (
                      <Text as="span" tone="subdued">—</Text>
                    )}
                  </div>
                  <Button
                    icon={() => <span style={{ fontSize: "20px", lineHeight: 1 }}>×</span>}
                    onClick={() => removeLine(index)}
                    tone="critical"
                    variant="plain"
                  />
                </InlineGrid>
              ))}

              <Button onClick={addLine} variant="secondary">+ Add Component</Button>
            </BlockStack>
          </Card>

          {lines.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#6d7175" }}>
              <Text as="p" variant="bodyMd">No components added yet.</Text>
              <Text as="p" variant="bodySm">Click "Add Component" to start mapping.</Text>
            </div>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}