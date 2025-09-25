import { Metadata } from 'next';
import { TemplatesPage } from '@/components/dashboard/TemplatesPage';

export const metadata: Metadata = {
  title: 'Templates - RepurposeAI',
  description: 'Browse and manage content templates for your videos',
};

export default function Templates() {
  return <TemplatesPage />;
}
