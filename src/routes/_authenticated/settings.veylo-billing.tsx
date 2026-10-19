import { createFileRoute } from '@tanstack/react-router';
import { VeyloBillingSettingsPage } from '@/components/veylo-addon-settings';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/_authenticated/settings/veylo-billing')({
  head: () => pageHead('Veylo Billing', 'Manage your Veylo monthly subscription.'),
  component: VeyloBillingSettingsPage,
});
