import { Metadata } from 'next';
import { AIClipsPage } from '@/components/dashboard/AIClipsPage';

export const metadata: Metadata = {
  title: 'AI Clips - RepurposeAI',
  description: 'Manage your AI-generated video clips and content',
};

export default function AIClips() {
  return <AIClipsPage />;
}
