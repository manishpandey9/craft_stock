// src/app/page.tsx
"use client";

import { Page, Layout, Card, Text, BlockStack } from "@shopify/polaris";

export default function Home() {
  return (
    <Page title="CraftStock">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                🎯 Welcome to CraftStock
              </Text>
              <Text as="p" variant="bodyMd">
                Track raw materials & hidden consumables for your Shopify products.
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Status: ✅ Frontend connected • Backend: http://localhost:8000
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}