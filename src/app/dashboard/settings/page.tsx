import { Metadata } from 'next';
import { SettingsPage } from '@/components/dashboard/SettingsPage';

export const metadata: Metadata = {
  title: 'Settings - RepurposeAI',
  description: 'Manage your account settings and preferences',
};

export default function Settings() {
  return <SettingsPage />;
}
