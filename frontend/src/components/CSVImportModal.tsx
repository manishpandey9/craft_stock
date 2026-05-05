// src/components/CSVImportModal.tsx
"use client";

import { useState, useRef } from "react";
import {
  Modal,
  BlockStack,
  Text,
  Button,
  Banner,
  Spinner,
  InlineGrid,
  Box,
  Icon,
} from "@shopify/polaris";
import { FileIcon, ArrowDownIcon, AlertCircleIcon } from "@shopify/polaris-icons";
import { downloadComponentTemplate, importComponents, type CSVImportResult } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({ open, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.xlsx')) {
        setError("Please select a CSV or Excel (.xlsx) file");
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await importComponents(file);
      setResult(res);
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to import CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadComponentTemplate();
    } catch (err) {
      setError("Failed to download template");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Components from CSV / Excel"
      primaryAction={{
        content: "Import",
        onAction: handleUpload,
        loading: uploading,
        disabled: !file || uploading,
      }}
      secondaryActions={[
        {
          content: "Download Template",
          onAction: handleDownloadTemplate,
          icon: ArrowDownIcon,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          {result?.success && (
            <Banner tone="success">
              <BlockStack gap="100">
                <Text as="h3" variant="bodyMd" fontWeight="bold">
                  ✅ Imported {result.imported_count} components
                </Text>
                {result.error_count > 0 && (
                  <Text as="p" variant="bodySm">
                    ⚠️ {result.error_count} rows had errors (see below)
                  </Text>
                )}
              </BlockStack>
            </Banner>
          )}

          {/* File Upload */}
          <Box
            padding="400"
            borderWidth="025"
            borderRadius="100"
            borderColor="border"
            background="bg-surface-secondary"
          >
            <InlineGrid columns="1fr auto" gap="300" alignItems="center">
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  {file ? file.name : "No file selected"}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  CSV or Excel file with columns: name, sku, component_type, unit, on_hand, threshold...
                </Text>
              </BlockStack>
              <div>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  ref={fileInputRef}
                />
                <Button icon={FileIcon} onClick={() => fileInputRef.current?.click()}>Choose File</Button>
              </div>
            </InlineGrid>
          </Box>

          {/* Import Results */}
          {result?.errors && result.errors.length > 0 && (
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm" tone="critical">Errors:</Text>
              <Box borderWidth="025" borderRadius="100">
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <Box
                      key={idx}
                      padding="200"
                      borderBlockEndWidth="025"
                      borderColor="border"
                    >
                      <InlineGrid columns="80px 1fr" gap="200">
                        <Text as="span" variant="bodySm" tone="subdued">Row {err.row}:</Text>
                        <Text as="span" variant="bodySm" tone="critical">{err.error}</Text>
                      </InlineGrid>
                    </Box>
                  ))}
                  {result.errors.length > 5 && (
                    <Box padding="200">
                      <Text as="p" variant="bodySm" tone="subdued">
                        + {result.errors.length - 5} more errors...
                      </Text>
                    </Box>
                  )}
                </div>
              </Box>
            </BlockStack>
          )}

          {/* Instructions */}
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">Instructions:</Text>
            <BlockStack gap="050">
              <InlineGrid columns="24px 1fr" gap="100">
                <Icon source={AlertCircleIcon} tone="base" />
                <Text as="p" variant="bodySm">Download the template CSV first</Text>
              </InlineGrid>
              <InlineGrid columns="24px 1fr" gap="100">
                <Icon source={AlertCircleIcon} tone="base" />
                <Text as="p" variant="bodySm">Fill in your component data (keep headers)</Text>
              </InlineGrid>
              <InlineGrid columns="24px 1fr" gap="100">
                <Icon source={AlertCircleIcon} tone="base" />
                <Text as="p" variant="bodySm">Upload the file and review results</Text>
              </InlineGrid>
            </BlockStack>
          </BlockStack>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}