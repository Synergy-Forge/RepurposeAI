import { Metadata } from 'next';
import { UploadPage } from '@/components/dashboard/UploadPage';

export const metadata: Metadata = {
  title: 'Upload Video - RepurposeAI',
  description: 'Upload your videos for AI-powered content transformation',
};

export default function Upload() {
  return <UploadPage />;
}
