import { Metadata } from 'next';
import { EditorPage } from '@/components/dashboard/EditorPage';

export const metadata: Metadata = {
  title: 'Video Editor - RepurposeAI',
  description: 'Edit and customize your video content with AI assistance',
};

export default function Editor() {
  return <EditorPage />;
}
