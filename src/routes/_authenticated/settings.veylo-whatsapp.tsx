import { createFileRoute } from '@tanstack/react-router';
import { VeyloWhatsAppSettingsPage } from '@/components/veylo-addon-settings';
import { pageHead } from '@/lib/page-head';

export const Route = createFileRoute('/_authenticated/settings/veylo-whatsapp')({
  head: () => pageHead('Veylo WhatsApp', 'Manage the Veylo WhatsApp subscription connection.'),
  component: VeyloWhatsAppSettingsPage,
});
