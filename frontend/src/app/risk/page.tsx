// src/app/risk/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  IndexTable,
  Badge,
  Spinner,
  InlineGrid,
  ProgressBar,
} from "@shopify/polaris";

interface RiskProduct {
  id: number;
  title: string;
  sku: string;
  status: "safe" | "at_risk" | "out_of_stock";
  can_make: number;
  demand_estimate: number;
  risk_pct: number;
  bottleneck: string | null;
}

export default function RiskDashboard() {
  const [products, setProducts] = useState<RiskProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ safe: 0, at_risk: 0, out_of_stock: 0 });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/risk/overview`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        const stats = { safe: 0, at_risk: 0, out_of_stock: 0 };
        data.products.forEach((p: RiskProduct) => {
          stats[p.status]++;
        });
        setStats(stats);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Page title="Risk Analysis">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spinner />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Product Risk Analysis">
      <Layout>
        {/* Summary Cards */}
        <Layout.Section>
          <InlineGrid columns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" tone="subdued">Safe to Produce</Text>
                <Text variant="headingLg" fontWeight="bold" tone="success">{stats.safe}</Text>
                <Text variant="bodySm">Sufficient stock</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" tone="subdued">At Risk</Text>
                <Text variant="headingLg" fontWeight="bold" tone="warning">{stats.at_risk}</Text>
                <Text variant="bodySm">Low component stock</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingSm" tone="subdued">Out of Stock</Text>
                <Text variant="headingLg" fontWeight="bold" tone="critical">{stats.out_of_stock}</Text>
                <Text variant="bodySm">Cannot produce</Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Main Table */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" fontWeight="bold">Production Readiness</Text>
              
              {products.length === 0 ? (
                <Text tone="subdued">No products with mapped BOMs found.</Text>
              ) : (
                <IndexTable
                  resourceName={{ singular: "product", plural: "products" }}
                  itemCount={products.length}
                  headings={[
                    { title: "Product" },
                    { title: "Status" },
                    { title: "Can Make" },
                    { title: "Risk Level" },
                    { title: "Bottleneck" },
                  ]}
                >
                  {products.map((product) => (
                    <IndexTable.Row id={product.id.toString()} key={product.id}>
                      <IndexTable.Cell>
                        <Text variant="bodyMd" fontWeight="bold">{product.title}</Text>
                        <Text variant="bodySm" tone="subdued">{product.sku}</Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Badge tone={product.status === 'safe' ? 'success' : product.status === 'at_risk' ? 'warning' : 'critical'}>
                          {product.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <Text variant="bodyMd">{product.can_make} units</Text>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        <div style={{ width: "100px" }}>
                          <ProgressBar progress={product.risk_pct} tone={product.risk_pct > 70 ? 'critical' : product.risk_pct > 30 ? 'warning' : 'success'} />
                        </div>
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {product.bottleneck ? (
                          <Text variant="bodySm" tone="critical">{product.bottleneck}</Text>
                        ) : (
                          <Text variant="bodySm" tone="subdued">-</Text>
                        )}
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}