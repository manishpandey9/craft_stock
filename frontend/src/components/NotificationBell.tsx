// src/components/NotificationBell.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  Badge,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Icon,
} from "@shopify/polaris";
import { NotificationIcon, CheckSmallIcon } from "@shopify/polaris-icons";
import { getAlertCount, fetchAlerts, markAlertRead, type Alert } from "@/lib/api";

export default function NotificationBell() {
  const [active, setActive] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    try {
      const [countData, alertsData] = await Promise.all([
        getAlertCount(),
        fetchAlerts(10)
      ]);
      setCount(countData.count);
      setAlerts(alertsData);
    } catch (err) {
      console.error("Failed to load alerts", err);
    }
  };

  useEffect(() => {
    if (active) {
      loadAlerts();
    }
  }, [active]);

  // Auto-refresh every 30 seconds when dropdown is open
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [active]);

  const handleMarkRead = async (alertId: number) => {
    try {
      await markAlertRead(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
      setCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark alert read", err);
    }
  };

  const getSeverityTone = (severity: string) => {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'warning';
      case 'medium': return 'caution';
      default: return 'info';
    }
  };

  const activator = (
    <div style={{ position: "relative" }}>
      <Button
        icon={NotificationIcon}
        variant="plain"
        onClick={() => setActive(!active)}
        accessibilityLabel="Notifications"
      />
      {count > 0 && (
        <div style={{ position: "absolute", top: -8, right: -8 }}>
          <Badge tone="critical">
            {count > 9 ? '9+' : count.toString()}
          </Badge>
        </div>
      )}
    </div>
  );

  return (
    <Popover
      active={active}
      onClose={() => setActive(false)}
      activator={activator}
      preferredAlignment="right"
    >
      <Box padding="400" minWidth="320px" maxWidth="400px">
        <BlockStack gap="300">
          <Text as="h3" variant="headingSm" fontWeight="bold">Notifications</Text>
          
          {loading ? (
            <Text as="p" tone="subdued">Loading...</Text>
          ) : alerts.length === 0 ? (
            <Text as="p" tone="subdued">No new alerts</Text>
          ) : (
            <BlockStack gap="200">
              {alerts.map(alert => (
                <Box
                  key={alert.id}
                  padding="200"
                  borderWidth="025"
                  borderRadius="100"
                  background={alert.severity === 'critical' ? 'bg-surface-secondary' : 'bg-surface'}
                >
                  <BlockStack gap="100">
                    <InlineStack gap="100" blockAlign="start" wrap={false}>
                      <Box paddingBlockStart="050">
                        <Icon source={CheckSmallIcon} tone={getSeverityTone(alert.severity)} />
                      </Box>
                      <div style={{ flex: 1 }}>
                        <BlockStack gap="025">
                          <Text as="p" variant="bodyMd" fontWeight="bold">{alert.title}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">{alert.message}</Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            {new Date(alert.created_at).toLocaleString()}
                          </Text>
                        </BlockStack>
                      </div>
                      <Button
                        size="micro"
                        onClick={() => handleMarkRead(alert.id)}
                      >
                        Mark read
                      </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              ))}
            </BlockStack>
          )}
        </BlockStack>
      </Box>
    </Popover>
  );
}