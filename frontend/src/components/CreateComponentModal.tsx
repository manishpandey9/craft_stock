import React, { useState, useCallback } from 'react';
import { Modal, Form, FormLayout, TextField, Select, BlockStack } from '@shopify/polaris';
import { createComponent } from '@/lib/api';

interface CreateComponentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateComponentModal({ open, onClose, onSuccess }: CreateComponentModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [componentType, setComponentType] = useState('raw_material');
  const [unit, setUnit] = useState('pcs');
  const [threshold, setThreshold] = useState('10');
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
    // Reset form on close
    setName('');
    setSku('');
    setComponentType('raw_material');
    setUnit('pcs');
    setThreshold('10');
  }, [onClose]);

  const handleSubmit = useCallback(async (event?: any) => {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    setLoading(true);
    try {
      await createComponent({
        name,
        sku,
        component_type: componentType as any,
        unit,
        threshold: parseInt(threshold, 10) || 0,
        on_hand: 0,
        available: 0,
        reserved: 0,
      });
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to create component:', error);
      // In a real app we might show a toast here
    } finally {
      setLoading(false);
    }
  }, [name, sku, componentType, unit, threshold, onSuccess, handleClose]);

  const componentTypeOptions = [
    { label: 'Raw Material', value: 'raw_material' },
    { label: 'Packaging', value: 'packaging' },
    { label: 'Insert', value: 'insert' },
    { label: 'Consumable', value: 'consumable' },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add new component"
      primaryAction={{
        content: 'Save',
        onAction: handleSubmit,
        loading: loading,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <BlockStack gap="400">
              <TextField
                label="Component Name"
                value={name}
                onChange={setName}
                autoComplete="off"
              />
              <TextField
                label="SKU"
                value={sku}
                onChange={setSku}
                autoComplete="off"
                helpText="Optional: Stock Keeping Unit"
              />
              <Select
                label="Component Type"
                options={componentTypeOptions}
                onChange={setComponentType}
                value={componentType}
              />
              <FormLayout.Group>
                <TextField
                  label="Unit"
                  value={unit}
                  onChange={setUnit}
                  autoComplete="off"
                  helpText="e.g., pcs, kg, m"
                />
                <TextField
                  label="Threshold"
                  type="number"
                  value={threshold}
                  onChange={setThreshold}
                  autoComplete="off"
                  helpText="Low stock alert level"
                />
              </FormLayout.Group>
            </BlockStack>
          </FormLayout>
        </Form>
      </Modal.Section>
    </Modal>
  );
}