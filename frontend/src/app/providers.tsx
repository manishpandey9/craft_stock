"use client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import AppLayout from "@/components/AppLayout";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <AppProvider i18n={enTranslations}>
      <AppLayout>{children}</AppLayout>
    </AppProvider>
  );
}
